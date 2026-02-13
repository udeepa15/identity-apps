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

import { ConstraintOperator, ProofAlgorithm, VCFormat } from "../constants/presentation-definition-constants";
import { ClaimConstraint, CredentialRequirement, PresentationDefinitionFormData } from "../models/presentation-definition-form";

/**
 * Field constraint structure for presentation_definition JSON.
 */
interface FieldConstraint {
    path: string[];
    filter?: {
        type: string;
        const?: string;
        pattern?: string;
        enum?: string[];
        contains?: { const: string };
    };
    optional?: boolean;
}

/**
 * Input descriptor structure for presentation_definition JSON.
 */
interface InputDescriptor {
    id: string;
    name?: string;
    purpose?: string;
    format?: Record<string, any> | string;
    constraints: {
        fields: FieldConstraint[];
    };
}

/**
 * Full presentation_definition JSON structure.
 */
export interface PresentationDefinitionJSON {
    id: string;
    input_descriptors: InputDescriptor[];
}

/**
 * Generates a spec-compliant presentation_definition JSON from form data.
 */
export function generatePresentationDefinition(
    form: PresentationDefinitionFormData
): PresentationDefinitionJSON {
    return {
        id: generateDefinitionId(form.name),
        input_descriptors: form.credentials.map(cred =>
            generateInputDescriptor(cred, form.purpose)
        )
    };
}

/**
 * Generates a deterministic ID from the definition name.
 */
function generateDefinitionId(name: string): string {
    const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_|_$/g, "")
        .substring(0, 40);

    return `${slug || "definition"}_${Date.now().toString(36)}`;
}

/**
 * Generates an input_descriptor from a credential requirement.
 */
function generateInputDescriptor(
    cred: CredentialRequirement,
    globalPurpose: string
): InputDescriptor {
    return {
        id: cred.id,
        name: cred.name,
        purpose: cred.purpose || globalPurpose,
        format: buildFormatObject(cred.format, cred.proofAlgorithm),
        constraints: {
            fields: buildFieldsArray(cred)
        }
    };
}

/**
 * Builds the format object with appropriate algorithm key.
 */
function buildFormatObject(
    format: VCFormat,
    algorithm: ProofAlgorithm
): Record<string, any> {
    if (format === VCFormat.SD_JWT_VC) {
        return {
            [format]: {
                "sd-jwt_alg_values": [algorithm],
                "kb-jwt_alg_values": [algorithm]
            }
        };
    }

    const isLdp = format === VCFormat.LDP_VC;
    const algKey = isLdp ? "proof_type" : "alg";

    return {
        [format]: {
            [algKey]: [algorithm]
        }
    };
}

/**
 * Builds the fields array for constraints.
 */
function buildFieldsArray(cred: CredentialRequirement): FieldConstraint[] {
    const fields: FieldConstraint[] = [];

    // 1. VC Type constraint (always added)
    // Hybrid/Universal approach: strict string pattern
    fields.push({
        path: getTypePath(cred.format),
        filter: {
            type: "string",
            pattern: cred.credentialType
        }
    });

    // 2. Issuer constraint (if specified)
    if (cred.issuerDids && cred.issuerDids.length > 0) {
        if (cred.issuerDids.length === 1) {
            // Single issuer - use const
            fields.push({
                path: getIssuerPath(cred.format),
                filter: {
                    type: "string",
                    const: cred.issuerDids[0]
                }
            });
        } else {
            // Multiple issuers - use enum
            fields.push({
                path: getIssuerPath(cred.format),
                filter: {
                    type: "string",
                    enum: cred.issuerDids
                }
            });
        }
    }

    // 3. Claim constraints
    cred.claimConstraints.forEach(claim => {
        if (claim.fieldName) {
            const fieldConstraint: FieldConstraint = {
                path: claim.fieldName === "email"
                    ? ["$.email", "$.credentialSubject.email"]
                    : [`$.credentialSubject.${claim.fieldName}`],
                optional: !claim.isRequired
            };

            const filter = buildClaimFilter(claim);
            if (filter) {
                fieldConstraint.filter = filter;
            }

            fields.push(fieldConstraint);
        }
    });

    return fields;
}

/**
 * Gets the correct JSONPath for VC type based on format.
 */
function getTypePath(format: VCFormat): string[] {
    // Universal path for hybrid request
    return ["$.vct", "$.vc.type", "$.type"];
}

/**
 * Gets the correct JSONPath(s) for issuer based on format.
 */
function getIssuerPath(format: VCFormat): string[] {
    return format === VCFormat.LDP_VC
        ? ["$.issuer", "$.issuer.id"]
        : ["$.vc.issuer", "$.vc.issuer.id", "$.iss"];
}

/**
 * Builds a filter object for a claim constraint.
 */
function buildClaimFilter(claim: ClaimConstraint): FieldConstraint["filter"] {
    switch (claim.operator) {
        case ConstraintOperator.EQUALS:
            return {
                type: "string",
                const: claim.value as string
            };
        case ConstraintOperator.CONTAINS:
            return {
                type: "string",
                pattern: claim.value as string
            };
        case ConstraintOperator.ONE_OF:
            return {
                type: "string",
                enum: claim.value as string[]
            };
        case ConstraintOperator.EXISTS:
        default:
            return undefined;
    }
}

/**
 * Converts the generated JSON to a formatted string.
 */
export function generatePresentationDefinitionString(
    form: PresentationDefinitionFormData
): string {
    const json = generatePresentationDefinition(form);
    return JSON.stringify(json, null, 2);
}
