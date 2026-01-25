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

import {
    ConstraintOperator,
    ProofAlgorithm,
    VCFormat
} from "../constants/presentation-definition-constants";
import {
    ClaimConstraint,
    CredentialRequirement,
    PresentationDefinitionFormData,
    generateId
} from "../models/presentation-definition-form";
import { PresentationDefinitionInterface } from "../models/presentation-definition";

/**
 * Maps a PresentationDefinitionInterface (and its JSON) to PresentationDefinitionFormData.
 * 
 * @param definition The presentation definition object
 * @returns Form data for the wizard
 */
export function mapDefinitionToFormData(definition: PresentationDefinitionInterface): PresentationDefinitionFormData {
    const formData: PresentationDefinitionFormData = {
        name: definition.name,
        description: definition.description || "",
        purpose: "Please share the requested credentials to proceed.", // Default, will override from first descriptor
        didMethod: "web",
        signingAlgorithm: "RS256",
        credentials: []
    };

    if (!definition.definitionJson) {
        return formData;
    }

    try {
        const json = JSON.parse(definition.definitionJson);

        // 1. Extract internal metadata if present
        if (json._internal) {
            if (json._internal.did_method) {
                formData.didMethod = json._internal.did_method;
            }
            if (json._internal.signing_algorithm) {
                formData.signingAlgorithm = json._internal.signing_algorithm;
            }
        }

        // 2. Map input descriptors
        if (Array.isArray(json.input_descriptors)) {
            // Use purpose from first descriptor as global purpose default
            if (json.input_descriptors.length > 0 && json.input_descriptors[0].purpose) {
                formData.purpose = json.input_descriptors[0].purpose;
            }

            formData.credentials = json.input_descriptors.map((descriptor: any) =>
                mapInputDescriptorToCredential(descriptor)
            );
        }

    } catch (e) {
        console.error("Failed to parse presentation definition JSON for editing", e);
    }

    return formData;
}

/**
 * Maps a single input descriptor to a CredentialRequirement.
 */
function mapInputDescriptorToCredential(descriptor: any): CredentialRequirement {
    const cred: CredentialRequirement = {
        id: descriptor.id || generateId("cred"),
        name: descriptor.name || "Credential Requirement",
        credentialType: "",
        purpose: descriptor.purpose,
        format: VCFormat.JWT_VC_JSON,
        proofAlgorithm: ProofAlgorithm.EDDSA,
        issuerDids: [],
        claimConstraints: []
    };

    // 1. Parse Format & Algorithm
    if (descriptor.format) {
        if (descriptor.format.jwt_vc_json) {
            cred.format = VCFormat.JWT_VC_JSON;
            if (descriptor.format.jwt_vc_json.alg && descriptor.format.jwt_vc_json.alg.length > 0) {
                cred.proofAlgorithm = descriptor.format.jwt_vc_json.alg[0] as ProofAlgorithm;
            }
        } else if (descriptor.format.ldp_vc) {
            cred.format = VCFormat.LDP_VC;
            if (descriptor.format.ldp_vc.proof_type && descriptor.format.ldp_vc.proof_type.length > 0) {
                cred.proofAlgorithm = descriptor.format.ldp_vc.proof_type[0] as ProofAlgorithm;
            }
        }
    }

    // 2. Parse Constraints
    if (descriptor.constraints && Array.isArray(descriptor.constraints.fields)) {
        descriptor.constraints.fields.forEach((field: any) => {
            const paths = field.path || [];
            const filter = field.filter;

            // A. VC Type Constraint
            if (paths.some((p: string) => p.includes("type"))) {
                if (filter && filter.contains && filter.contains.const) {
                    cred.credentialType = filter.contains.const;
                } else if (filter && filter.pattern) {
                    cred.credentialType = filter.pattern;
                }
                return;
            }

            // B. Issuer Constraint
            if (paths.some((p: string) => p.includes("issuer"))) {
                if (filter) {
                    if (filter.const) {
                        cred.issuerDids = [filter.const];
                    } else if (filter.enum) {
                        cred.issuerDids = filter.enum;
                    }
                }
                return;
            }

            // C. Claim Constraint (Credential Subject)
            if (paths.some((p: string) => p.includes("credentialSubject"))) {
                // Extract field name from path (e.g. $.credentialSubject.fname)
                const fieldNameMatch = paths[0].match(/credentialSubject\.([^"\s]+)/);
                const fieldName = fieldNameMatch ? fieldNameMatch[1] : "";

                if (fieldName) {
                    const claim: ClaimConstraint = {
                        id: generateId("claim"),
                        fieldName: fieldName,
                        operator: ConstraintOperator.EXISTS,
                        isRequired: !field.optional
                    };

                    if (filter) {
                        if (filter.const) {
                            claim.operator = ConstraintOperator.EQUALS;
                            claim.value = filter.const;
                        } else if (filter.pattern) {
                            claim.operator = ConstraintOperator.CONTAINS;
                            claim.value = filter.pattern;
                        } else if (filter.enum) {
                            claim.operator = ConstraintOperator.ONE_OF;
                            claim.value = filter.enum;
                        }
                    }

                    cred.claimConstraints.push(claim);
                }
            }
        });
    }

    return cred;
}
