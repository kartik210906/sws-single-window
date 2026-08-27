from rapidfuzz import fuzz

class ValidationService:
    @staticmethod
    def verify_document(
        extracted_text: str,
        required_keywords: list[str],
        applicant_name: str | None = None,
        min_score: float = 75.0
    ) -> dict:
        """
        Fuzzy matches keywords and applicant name coordinates in OCR output text.
        """
        text_upper = extracted_text.upper()
        # Remove empty strings and build uppercase comparison lists
        lines = [line.strip().upper() for line in text_upper.split("\n") if line.strip()]
        
        results = {
            "is_valid": True,
            "keyword_validation": {},
            "name_validation": {
                "verified": True,
                "score": 100.0,
                "matched_segment": None,
                "error": None
            },
            "summary": "Verification completed successfully."
        }

        # 1. Evaluate Required Keywords (using partial ratio)
        for keyword in required_keywords:
            keyword_upper = keyword.upper()
            best_match = None
            best_score = 0.0

            for line in lines:
                score = fuzz.partial_ratio(keyword_upper, line)
                if score > best_score:
                    best_score = score
                    best_match = line

            passed = best_score >= min_score
            results["keyword_validation"][keyword] = {
                "passed": passed,
                "score": round(best_score, 2),
                "matched_text": best_match if passed else None
            }

            if not passed:
                results["is_valid"] = False

        # 2. Evaluate Applicant Name (using token set ratio)
        if applicant_name:
            name_upper = applicant_name.upper()
            best_name_match = None
            best_name_score = 0.0

            for line in lines:
                score = fuzz.token_set_ratio(name_upper, line)
                if score > best_name_score:
                    best_name_score = score
                    best_name_match = line

            name_passed = best_name_score >= min_score
            results["name_validation"] = {
                "verified": name_passed,
                "score": round(best_name_score, 2),
                "matched_segment": best_name_match if name_passed else None,
                "error": None if name_passed else f"Applicant name matching score ({round(best_name_score, 2)}) below threshold ({min_score})."
            }

            if not name_passed:
                results["is_valid"] = False
        else:
            results["name_validation"] = {
                "verified": True,
                "score": 0.0,
                "matched_segment": None,
                "error": "Applicant name verification bypassed."
            }

        # Set final outcome message
        if not results["is_valid"]:
            reasons = []
            failed_keys = [k for k, v in results["keyword_validation"].items() if not v["passed"]]
            if failed_keys:
                reasons.append(f"Missing mandatory keywords: {failed_keys}")
            if not results["name_validation"]["verified"]:
                reasons.append("Verification name not matched")
            results["summary"] = f"Verification Failed: {', '.join(reasons)}"

        return results
