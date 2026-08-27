const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Endpoint to parse and route unified incoming business application payloads.
 * Validates inputs and writes to Master and Department tables atomically.
 */
exports.submitUnifiedForm = async (req, res) => {
  const { businessName, applicantId, fireSafety, waterCompliance } = req.body;

  // 1. Strict Input verification (No placeholders)
  if (!businessName || !applicantId) {
    return res.status(400).json({
      success: false,
      message: "Missing required fields. Provide businessName and applicantId."
    });
  }

  if (!fireSafety || !waterCompliance) {
    return res.status(400).json({
      success: false,
      message: "Both fireSafety and waterCompliance data blocks are required for parallel routing."
    });
  }

  try {
    // 2. Write to master and queue tables using a database transaction.
    // If any write fails, the entire transaction rolls back automatically.
    const result = await prisma.$transaction(async (tx) => {
      // Create unified parent application
      const unifiedApp = await tx.unifiedApplication.create({
        data: {
          businessName,
          applicantId,
          rawPayload: req.body
        }
      });

      // Split data block and write to Fire Queue
      const fireQueueRecord = await tx.fireDepartmentQueue.create({
        data: {
          applicationId: unifiedApp.id,
          extractedData: fireSafety
        }
      });

      // Split data block and write to Water Queue
      const waterQueueRecord = await tx.waterDepartmentQueue.create({
        data: {
          applicationId: unifiedApp.id,
          extractedData: waterCompliance
        }
      });

      return {
        applicationId: unifiedApp.id,
        fireRecordId: fireQueueRecord.id,
        waterRecordId: waterQueueRecord.id
      };
    });

    return res.status(201).json({
      success: true,
      message: "Application successfully parsed, split, and queued to departments in parallel.",
      data: result
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to route submission. Database transaction aborted.",
      error: error.message
    });
  }
};

/**
 * Returns queue entries for a given department.
 */
exports.getDepartmentQueue = async (req, res) => {
  const { department } = req.params; // 'fire' or 'water'

  try {
    if (department === 'fire') {
      const fireQueue = await prisma.fireDepartmentQueue.findMany({
        include: {
          application: {
            select: {
              businessName: true,
              applicantId: true,
              submittedAt: true,
              overallStatus: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
      return res.status(200).json({ success: true, data: fireQueue });

    } else if (department === 'water') {
      const waterQueue = await prisma.waterDepartmentQueue.findMany({
        include: {
          application: {
            select: {
              businessName: true,
              applicantId: true,
              submittedAt: true,
              overallStatus: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
      return res.status(200).json({ success: true, data: waterQueue });

    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid department specified. Valid options: 'fire' or 'water'."
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to query departmental queues.",
      error: error.message
    });
  }
};

/**
 * Updates status of a department queue item and recalculates overall application status.
 */
exports.updateQueueItemStatus = async (req, res) => {
  const { department, queueItemId } = req.params;
  const { status, remarks, reviewerId = "admin_reviewer_01" } = req.body;

  if (!status) {
    return res.status(400).json({ success: false, message: "Missing status parameter." });
  }

  try {
    const updated = await prisma.$transaction(async (tx) => {
      let masterId = null;

      // 1. Update status on targeted queue
      if (department === 'fire') {
        const item = await tx.fireDepartmentQueue.update({
          where: { id: queueItemId },
          data: {
            status,
            reviewerRemarks: remarks,
            reviewedBy: reviewerId,
            reviewedAt: new Date()
          }
        });
        masterId = item.applicationId;
      } else if (department === 'water') {
        const item = await tx.waterDepartmentQueue.update({
          where: { id: queueItemId },
          data: {
            status,
            reviewerRemarks: remarks,
            reviewedBy: reviewerId,
            reviewedAt: new Date()
          }
        });
        masterId = item.applicationId;
      } else {
        throw new Error("Invalid department target.");
      }

      // 2. Fetch statuses of both departments for this application to sync the overall status
      const fireItem = await tx.fireDepartmentQueue.findUnique({
        where: { applicationId: masterId },
        select: { status: true }
      });
      const waterItem = await tx.waterDepartmentQueue.findUnique({
        where: { applicationId: masterId },
        select: { status: true }
      });

      const fireStatus = fireItem?.status;
      const waterStatus = waterItem?.status;

      // Sync Rules:
      // - If any department rejects: Overall status is REJECTED
      // - If all departments approve: Overall status is APPROVED
      // - Otherwise: UNDER_REVIEW/PENDING
      let nextOverallStatus = 'PENDING';
      if (fireStatus === 'REJECTED' || waterStatus === 'REJECTED') {
        nextOverallStatus = 'REJECTED';
      } else if (fireStatus === 'APPROVED' && waterStatus === 'APPROVED') {
        nextOverallStatus = 'APPROVED';
      } else if (fireStatus === 'UNDER_REVIEW' || waterStatus === 'UNDER_REVIEW') {
        nextOverallStatus = 'UNDER_REVIEW';
      } else if (fireStatus === 'ACTION_REQUIRED' || waterStatus === 'ACTION_REQUIRED') {
        nextOverallStatus = 'ACTION_REQUIRED';
      }

      await tx.unifiedApplication.update({
        where: { id: masterId },
        data: { overallStatus: nextOverallStatus }
      });

      return { queueItemId, status, overallStatus: nextOverallStatus };
    });

    return res.status(200).json({
      success: true,
      message: "Department status updated and master application status synced successfully.",
      data: updated
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update queue item status.",
      error: error.message
    });
  }
};
