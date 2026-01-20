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
import { Hint, Message, PrimaryButton } from "@wso2is/react-components";
import React, { FunctionComponent, ReactElement, useCallback } from "react";
import { Button, Card, Form, Grid, Icon, Input } from "semantic-ui-react";
import { COMMON_CREDENTIAL_TYPES } from "../../../constants/presentation-definition-constants";
import {
    createCredentialRequirement,
    CredentialRequirement,
    PresentationDefinitionFormData,
    ValidationError
} from "../../../models/presentation-definition-form";

/**
 * Props for CredentialRequirementsStep component.
 */
interface CredentialRequirementsStepProps extends IdentifiableComponentInterface {
    /** Current form data */
    formData: PresentationDefinitionFormData;
    /** Callback to update form data */
    onChange: (updates: Partial<PresentationDefinitionFormData>) => void;
    /** Validation errors */
    errors: ValidationError[];
}

/**
 * Step 2: Credential Requirements.
 * Add one or more credential types to request.
 */
const CredentialRequirementsStep: FunctionComponent<CredentialRequirementsStepProps> = ({
    formData,
    onChange,
    errors,
    "data-componentid": componentId = "credential-requirements-step"
}: CredentialRequirementsStepProps): ReactElement => {

    /**
     * Adds a new credential requirement.
     */
    const addCredential = useCallback(() => {
        const newCredential = createCredentialRequirement();
        onChange({
            credentials: [...formData.credentials, newCredential]
        });
    }, [formData.credentials, onChange]);

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
     * Removes a credential requirement.
     */
    const removeCredential = useCallback((index: number) => {
        const filtered = formData.credentials.filter((_, i) => i !== index);
        onChange({ credentials: filtered });
    }, [formData.credentials, onChange]);

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
     * Generates ID from credential type.
     */
    const generateIdFromType = (type: string): string => {
        return type
            .replace(/([A-Z])/g, "_$1")
            .toLowerCase()
            .replace(/^_/, "")
            .replace(/credential$/, "")
            .replace(/_+/g, "_")
            .replace(/_$/, "");
    };

    /**
     * Handles credential type change and auto-generates name/ID.
     */
    const handleTypeChange = (index: number, type: string) => {
        const id = generateIdFromType(type) || `credential_${index + 1}`;
        updateCredential(index, {
            credentialType: type,
            name: type || "New Credential",
            id: `${id}_${Math.random().toString(36).substring(2, 7)}`
        });
    };

    // Check if we have any credentials
    const hasNoCredentials = errors.find(e => e.field === "credentials");

    return (
        <div data-componentid={componentId}>
            {/* Error message if no credentials */}
            {hasNoCredentials && (
                <Message
                    type="warning"
                    content={hasNoCredentials.message}
                    data-componentid={`${componentId}-no-credentials-warning`}
                />
            )}

            {/* Credential Cards */}
            {formData.credentials.map((credential, index) => (
                <Card fluid key={credential.id} className="mb-4">
                    <Card.Content>
                        <Card.Header>
                            <Grid>
                                <Grid.Row>
                                    <Grid.Column width={14}>
                                        <Icon name="id card" />
                                        {credential.name || `Credential ${index + 1}`}
                                    </Grid.Column>
                                    <Grid.Column width={2} textAlign="right">
                                        <Button
                                            icon="trash"
                                            basic
                                            negative
                                            size="mini"
                                            onClick={() => removeCredential(index)}
                                            title="Remove credential"
                                            data-componentid={`${componentId}-remove-${index}`}
                                        />
                                    </Grid.Column>
                                </Grid.Row>
                            </Grid>
                        </Card.Header>
                    </Card.Content>
                    <Card.Content>
                        <Form>
                            <Grid>
                                {/* Credential Type */}
                                <Grid.Row columns={1}>
                                    <Grid.Column>
                                        <Form.Field required error={!!getCredentialError(index, "credentialType")}>
                                            <label>Credential Type</label>
                                            <Input
                                                list={`${componentId}-type-options-${index}`}
                                                placeholder="e.g., IdentityCredential"
                                                value={credential.credentialType}
                                                onChange={(e) => handleTypeChange(index, e.target.value)}
                                                data-componentid={`${componentId}-type-input-${index}`}
                                            />
                                            <datalist id={`${componentId}-type-options-${index}`}>
                                                {COMMON_CREDENTIAL_TYPES.map(type => (
                                                    <option key={type} value={type} />
                                                ))}
                                            </datalist>
                                            {getCredentialError(index, "credentialType") && (
                                                <Message
                                                    type="error"
                                                    content={getCredentialError(index, "credentialType")}
                                                />
                                            )}
                                            <Hint compact>
                                                The VC type to request (e.g., IdentityCredential, DriverLicenseCredential)
                                            </Hint>
                                        </Form.Field>
                                    </Grid.Column>
                                </Grid.Row>

                                {/* Display Name */}
                                <Grid.Row columns={2}>
                                    <Grid.Column>
                                        <Form.Field>
                                            <label>Display Name</label>
                                            <Input
                                                placeholder="User-friendly name"
                                                value={credential.name}
                                                onChange={(e) => updateCredential(index, { name: e.target.value })}
                                                data-componentid={`${componentId}-name-input-${index}`}
                                            />
                                        </Form.Field>
                                    </Grid.Column>
                                    <Grid.Column>
                                        <Form.Field>
                                            <label>Logical ID</label>
                                            <Input
                                                disabled
                                                value={credential.id}
                                                data-componentid={`${componentId}-id-display-${index}`}
                                            />
                                            <Hint compact>Auto-generated identifier</Hint>
                                        </Form.Field>
                                    </Grid.Column>
                                </Grid.Row>

                                {/* Purpose Override (Optional) */}
                                <Grid.Row columns={1}>
                                    <Grid.Column>
                                        <Form.Field>
                                            <label>Purpose Override (Optional)</label>
                                            <Input
                                                placeholder="Leave blank to use global purpose"
                                                value={credential.purpose || ""}
                                                onChange={(e) => updateCredential(index, {
                                                    purpose: e.target.value || undefined
                                                })}
                                                data-componentid={`${componentId}-purpose-input-${index}`}
                                            />
                                            <Hint compact>
                                                Override the global purpose text for this specific credential.
                                            </Hint>
                                        </Form.Field>
                                    </Grid.Column>
                                </Grid.Row>
                            </Grid>
                        </Form>
                    </Card.Content>
                </Card>
            ))}

            {/* Add Credential Button */}
            <div className="mt-4">
                <PrimaryButton
                    onClick={addCredential}
                    data-componentid={`${componentId}-add-button`}
                >
                    <Icon name="add" />
                    Add Credential Requirement
                </PrimaryButton>
            </div>

            <Hint className="mt-4">
                Add one or more credential types that users must present.
                Each credential becomes an input_descriptor in the final JSON.
            </Hint>
        </div>
    );
};

export default CredentialRequirementsStep;
