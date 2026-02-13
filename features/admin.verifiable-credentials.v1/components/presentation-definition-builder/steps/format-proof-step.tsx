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

import { IdentifiableComponentInterface } from "@wso2is/core/models";
import { Hint, Message } from "@wso2is/react-components";
import React, { FunctionComponent, ReactElement, useCallback } from "react";
import { Card, Dropdown, Form, Grid, Icon, Input, Radio } from "semantic-ui-react";
import {
    ALGORITHM_LABELS,
    ProofAlgorithm,
    VC_FORMAT_LABELS,
    VCFormat
} from "../../../constants/presentation-definition-constants";
import {
    CredentialRequirement,
    PresentationDefinitionFormData,
    ValidationError
} from "../../../models/presentation-definition-form";
import { getValidAlgorithmsForFormat } from "../../../utils/validation";

/**
 * Props for FormatProofStep component.
 */
interface FormatProofStepProps extends IdentifiableComponentInterface {
    /** Current form data */
    formData: PresentationDefinitionFormData;
    /** Callback to update form data */
    onChange: (updates: Partial<PresentationDefinitionFormData>) => void;
    /** Validation errors */
    errors: ValidationError[];
}

/**
 * Step 3: Format & Proof Selection.
 * Configure VC format and proof algorithm for each credential.
 */
const FormatProofStep: FunctionComponent<FormatProofStepProps> = ({
    formData,
    onChange,
    errors,
    "data-componentid": componentId = "format-proof-step"
}: FormatProofStepProps): ReactElement => {

    /**
     * Updates a specific credential requirement.
     */
    const updateCredential = useCallback((
        index: number,
        updates: Partial<CredentialRequirement>
    ) => {
        const updated = formData.credentials.map((cred, i) =>
            i === index ? { ...cred, ...updates } : cred
        );
        onChange({ credentials: updated });
    }, [formData.credentials, onChange]);

    /**
     * Handles format change and resets algorithm if incompatible.
     */
    /**
     * Handles format change.
     */
    const handleFormatChange = (index: number, format: VCFormat) => {
        updateCredential(index, {
            format
            // We don't need to reset proofAlgorithm because any algorithm is now allowed
        });
    };

    /**
     * Gets error for a credential field.
     */
    const getCredentialError = (index: number, field: string): string | undefined => {
        const error = errors.find(
            e => e.field === `credentials[${index}].${field}` && e.severity === "error"
        );
        return error?.message;
    };

    /**
     * Gets warning for a credential field.
     */
    const getCredentialWarning = (index: number, field: string): string | undefined => {
        const warning = errors.find(
            e => e.field === `credentials[${index}].${field}` && e.severity === "warning"
        );
        return warning?.message;
    };

    /**
     * Generates dropdown options for algorithms based on format.
     */
    const getAlgorithmOptions = (format: VCFormat) => {
        return getValidAlgorithmsForFormat(format).map(alg => ({
            key: alg,
            text: ALGORITHM_LABELS[alg],
            value: alg
        }));
    };

    if (formData.credentials.length === 0) {
        return (
            <Message
                type="warning"
                content="No credentials configured. Go back and add credential requirements first."
                data-componentid={`${componentId}-no-credentials-warning`}
            />
        );
    }

    return (
        <div data-componentid={componentId}>
            {formData.credentials.map((credential, index) => (
                <Card fluid key={credential.id} className="mb-4">
                    <Card.Content>
                        <Card.Header>
                            <Icon name="id card" />
                            {credential.name || credential.credentialType}
                        </Card.Header>
                        <Card.Meta>{credential.credentialType}</Card.Meta>
                    </Card.Content>
                    <Card.Content>
                        <Form>
                            <Grid>
                                {/* VC Format Selection */}
                                <Grid.Row columns={1}>
                                    <Grid.Column>
                                        <Form.Field>
                                            <label>Credential Format</label>
                                            <Grid columns={3}>
                                                {Object.values(VCFormat).map(format => (
                                                    <Grid.Column key={format}>
                                                        <Radio
                                                            label={VC_FORMAT_LABELS[format]}
                                                            name={`format-${index}`}
                                                            value={format}
                                                            checked={credential.format === format}
                                                            onChange={() => handleFormatChange(index, format)}
                                                            data-componentid={`${componentId}-format-${format}-${index}`}
                                                        />
                                                    </Grid.Column>
                                                ))}
                                            </Grid>
                                            {getCredentialWarning(index, "format") && (
                                                <Message
                                                    type="warning"
                                                    content={getCredentialWarning(index, "format")}
                                                />
                                            )}
                                            <Hint compact>
                                                Choose the expected format of the Verifiable Credential.
                                            </Hint>
                                        </Form.Field>
                                    </Grid.Column>
                                </Grid.Row>

                                {/* Proof Algorithm Selection */}
                                <Grid.Row columns={1}>
                                    <Grid.Column>
                                        <Form.Field error={!!getCredentialError(index, "proofAlgorithm")}>
                                            <label>Proof Algorithm</label>
                                            <Dropdown
                                                selection
                                                options={getAlgorithmOptions(credential.format)}
                                                value={credential.proofAlgorithm}
                                                onChange={(_, { value }) =>
                                                    updateCredential(index, {
                                                        proofAlgorithm: value as ProofAlgorithm
                                                    })
                                                }
                                                data-componentid={`${componentId}-algorithm-${index}`}
                                            />
                                            {getCredentialError(index, "proofAlgorithm") && (
                                                <Message
                                                    type="error"
                                                    content={getCredentialError(index, "proofAlgorithm")}
                                                />
                                            )}
                                            <Hint compact>
                                                Select the signature algorithm for verification.
                                            </Hint>
                                        </Form.Field>
                                    </Grid.Column>
                                </Grid.Row>
                            </Grid>
                        </Form>
                    </Card.Content>
                </Card>
            ))}

            <Hint className="mt-4">
                Configure the expected format and signature algorithm for each credential.
                Invalid combinations are automatically prevented.
            </Hint>
        </div>
    );
};

export default FormatProofStep;
