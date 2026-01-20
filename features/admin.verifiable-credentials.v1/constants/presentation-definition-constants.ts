/**
 * Copyright (c) 2025, WSO2 LLC. (https://www.wso2.com).
 *
 * WSO2 LLC. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

/**
 * Verifiable Credential format types.
 * Based on OpenID4VP and DIF Presentation Exchange specs.
 */
export enum VCFormat {
    /** Linked Data Proof VC */
    LDP_VC = "ldp_vc",
    /** JWT VC (plain JSON) */
    JWT_VC_JSON = "jwt_vc_json",
    /** SD-JWT VC (Selective Disclosure) */
    SD_JWT_VC = "vc+sd-jwt"
}

/**
 * Proof/Signature algorithms.
 * Scoped to WSO2 IS supported algorithms.
 */
export enum ProofAlgorithm {
    // Linked Data Proof Types
    ED25519_2020 = "Ed25519Signature2020",
    ED25519_2018 = "Ed25519Signature2018",
    JSON_WEB_SIG_2020 = "JsonWebSignature2020",
    // JWT Algorithms
    ES256 = "ES256",
    ES384 = "ES384",
    EDDSA = "EdDSA",
    RS256 = "RS256"
}

/**
 * Constraint operators for claim filtering.
 */
export enum ConstraintOperator {
    /** Exact match */
    EQUALS = "equals",
    /** Substring/pattern match */
    CONTAINS = "contains",
    /** Field must exist */
    EXISTS = "exists",
    /** Match one of multiple values */
    ONE_OF = "oneOf"
}

/**
 * Format-algorithm compatibility matrix.
 * Used for validation and UI filtering.
 */
export const FORMAT_ALGORITHM_MATRIX: Record<VCFormat, ProofAlgorithm[]> = {
    [VCFormat.LDP_VC]: [
        ProofAlgorithm.ED25519_2020,
        ProofAlgorithm.ED25519_2018,
        ProofAlgorithm.JSON_WEB_SIG_2020
    ],
    [VCFormat.JWT_VC_JSON]: [
        ProofAlgorithm.ES256,
        ProofAlgorithm.ES384,
        ProofAlgorithm.EDDSA,
        ProofAlgorithm.RS256
    ],
    [VCFormat.SD_JWT_VC]: [
        ProofAlgorithm.ES256,
        ProofAlgorithm.ES384,
        ProofAlgorithm.EDDSA
    ]
};

/**
 * Display labels for VC formats.
 */
export const VC_FORMAT_LABELS: Record<VCFormat, string> = {
    [VCFormat.LDP_VC]: "Linked Data VC",
    [VCFormat.JWT_VC_JSON]: "JWT VC",
    [VCFormat.SD_JWT_VC]: "SD-JWT VC"
};

/**
 * Display labels for algorithms.
 */
export const ALGORITHM_LABELS: Record<ProofAlgorithm, string> = {
    [ProofAlgorithm.ED25519_2020]: "Ed25519Signature2020",
    [ProofAlgorithm.ED25519_2018]: "Ed25519Signature2018",
    [ProofAlgorithm.JSON_WEB_SIG_2020]: "JsonWebSignature2020",
    [ProofAlgorithm.ES256]: "ES256 (ECDSA P-256)",
    [ProofAlgorithm.ES384]: "ES384 (ECDSA P-384)",
    [ProofAlgorithm.EDDSA]: "EdDSA (Ed25519)",
    [ProofAlgorithm.RS256]: "RS256 (RSA)"
};

/**
 * Display labels for constraint operators.
 */
export const CONSTRAINT_OPERATOR_LABELS: Record<ConstraintOperator, string> = {
    [ConstraintOperator.EQUALS]: "Equals",
    [ConstraintOperator.CONTAINS]: "Contains",
    [ConstraintOperator.EXISTS]: "Exists",
    [ConstraintOperator.ONE_OF]: "One of"
};

/**
 * Common credential types for autocomplete suggestions.
 */
export const COMMON_CREDENTIAL_TYPES: string[] = [
    "VerifiableCredential",
    "IdentityCredential",
    "EmployeeCredential",
    "EducationCredential",
    "DriverLicenseCredential",
    "PassportCredential",
    "HealthCredential",
    "AgeVerificationCredential",
    "AddressCredential",
    "BankAccountCredential"
];

/**
 * Common claim field names for suggestions.
 */
export const COMMON_CLAIM_FIELDS: string[] = [
    "email",
    "name",
    "givenName",
    "familyName",
    "dateOfBirth",
    "address",
    "phoneNumber",
    "nationality",
    "gender",
    "issuanceDate",
    "expirationDate"
];

/**
 * DID method patterns for validation.
 */
export const DID_PATTERN = /^did:[a-z0-9]+:[a-zA-Z0-9._%-]+$/;

/**
 * Default purpose text for presentations.
 */
export const DEFAULT_PURPOSE = "Please share the requested credentials to proceed.";

/**
 * Wizard step IDs.
 */
export enum WizardStep {
    BASIC_INFO = 0,
    CREDENTIALS = 1,
    FORMAT = 2,
    CONSTRAINTS = 3,
    PREVIEW = 4
}

/**
 * Wizard step labels.
 */
export const WIZARD_STEP_LABELS: string[] = [
    "Basic Information",
    "Credential Requirements",
    "Format & Proof",
    "Constraints",
    "Preview"
];
