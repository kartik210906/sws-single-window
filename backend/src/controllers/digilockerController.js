// Simulates the centralized API Setu registry database
const MOCK_GOVERNMENT_REGISTRY = {
  aadhaar: {
    "123456789012": {
      fullName: "Rajesh Kumar",
      dob: "1988-12-05",
      gender: "MALE",
      address: "Plot 42, Innovation Colony, New Delhi, DL - 110001",
      phone: "+919876543210",
      email: "rajesh.kumar@sih.gov.in",
      verified: true,
      issuedBy: "UIDAI"
    },
    "987654321098": {
      fullName: "Priya Sharma",
      dob: "1993-04-20",
      gender: "FEMALE",
      address: "Flat 101, Dynamic Heights, Mumbai, MH - 400001",
      phone: "+918765432109",
      email: "priya.sharma@sih.gov.in",
      verified: true,
      issuedBy: "UIDAI"
    }
  },
  pan: {
    "ABCDE1234F": {
      fullName: "KARTIK SHARMA",
      dob: "1995-08-15",
      panType: "INDIVIDUAL",
      fatherName: "OP SHARMA",
      address: "Flat 101, Dynamic Heights, Mumbai, MH - 400001",
      verified: true,
      issuedBy: "Income Tax Department"
    },
    "XYZAB5678C": {
      fullName: "KARTIK BIOTECH INDUSTRIES",
      dob: "2018-11-30",
      panType: "COMPANY",
      fatherName: "N/A",
      address: "Plot 5A, Tech Park, Sector 62, Noida, UP - 201301",
      verified: true,
      issuedBy: "Income Tax Department"
    }
  }
};

/**
 * Handles DigiLocker/API Setu profile lookups using Aadhaar or PAN.
 */
exports.verifyIdentityDocument = async (req, res) => {
  const { docType, docNumber } = req.body;

  // 1. Inputs validation
  if (!docType || !docNumber) {
    return res.status(400).json({
      success: false,
      message: "Missing parameter details. Both docType ('aadhaar' or 'pan') and docNumber are required."
    });
  }

  const normalizedType = docType.toLowerCase();
  const cleanDocNumber = docNumber.trim().replace(/\s+/g, ''); // strip spaces

  if (normalizedType !== 'aadhaar' && normalizedType !== 'pan') {
    return res.status(400).json({
      success: false,
      message: "Invalid docType. Government registry search restricted to 'aadhaar' or 'pan'."
    });
  }

  // 2. Format validations matching actual patterns
  if (normalizedType === 'aadhaar') {
    const aadhaarRegex = /^\d{12}$/;
    if (!aadhaarRegex.test(cleanDocNumber)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Aadhaar layout. Aadhaar numbers must be exactly 12 numeric digits."
      });
    }
  } else if (normalizedType === 'pan') {
    const panRegex = /^[A-Z]{5}\d{4}[A-Z]{1}$/i;
    if (!panRegex.test(cleanDocNumber)) {
      return res.status(400).json({
        success: false,
        message: "Invalid PAN layout. PAN must follow standard 10-character alphanumeric formats (e.g., ABCDE1234F)."
      });
    }
  }

  // 3. Search Mock Registry database
  try {
    const registryCategory = MOCK_GOVERNMENT_REGISTRY[normalizedType];
    const upperDocNumber = cleanDocNumber.toUpperCase();
    const userProfile = registryCategory[upperDocNumber] || registryCategory[cleanDocNumber];

    if (!userProfile) {
      return res.status(404).json({
        success: false,
        message: `Verification Failed. No matching record found in official API Setu registry for this ${docType.toUpperCase()} number.`
      });
    }

    // Delay response slightly to simulate API Setu handshake network calls
    await new Promise(resolve => setTimeout(resolve, 800));

    return res.status(200).json({
      success: true,
      message: "Document identity verified successfully by DigiLocker API Setu Gateway.",
      data: userProfile
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "API Setu Gateway error encountered.",
      error: error.message
    });
  }
};
