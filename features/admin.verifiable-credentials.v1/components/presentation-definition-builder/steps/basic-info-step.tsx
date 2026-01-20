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
import { Field, Form } from "@wso2is/form";
import { Hint, Message } from "@wso2is/react-components";
import React, { FunctionComponent, ReactElement } from "react";
import { Grid } from "semantic-ui-react";
import { DEFAULT_PURPOSE } from "../../../constants/presentation-definition-constants";
import { PresentationDefinitionFormData, ValidationError } from "../../../models/presentation-definition-form";

/**
 * Props for BasicInfoStep component.
 */
interface BasicInfoStepProps extends IdentifiableComponentInterface {
    /** Current form data */
    formData: PresentationDefinitionFormData;
    /** Callback to update form data */
    onChange: (updates: Partial<PresentationDefinitionFormData>) => void;
    /** Validation errors */
    errors: ValidationError[];
}

/**
 * Step 1: Basic Information.
 * Collects name, purpose, and description.
 */
const BasicInfoStep: FunctionComponent<BasicInfoStepProps> = ({
    formData,
    onChange,
    errors,
    "data-componentid": componentId = "basic-info-step"
}: BasicInfoStepProps): ReactElement => {

    /**
     * Gets error message for a specific field.
     */
    const getError = (fieldName: string): string | undefined => {
        const error = errors.find(e => e.field === fieldName && e.severity === "error");
        return error?.message;
    };

    /**
     * Gets warning message for a specific field.
     */
    const getWarning = (fieldName: string): string | undefined => {
        const warning = errors.find(e => e.field === fieldName && e.severity === "warning");
        return warning?.message;
    };

    return (
        <div data-componentid={componentId}>
            <Form
                id={`${componentId}-form`}
                uncontrolledForm={true}
                onSubmit={() => { /* Handled by wizard */ }}
            >
                <Grid>
                    {/* Name Field */}
                    <Grid.Row columns={1}>
                        <Grid.Column mobile={16} tablet={16} computer={10}>
                            <Field.Input
                                ariaLabel="Definition Name"
                                inputType="text"
                                name="name"
                                label="Definition Name"
                                required={true}
                                placeholder="e.g., Employee Verification"
                                value={formData.name}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                    onChange({ name: e.target.value });
                                }}
                                maxLength={100}
                                minLength={3}
                                data-componentid={`${componentId}-name-input`}
                            />
                            {getError("name") && (
                                <Message
                                    type="error"
                                    content={getError("name")}
                                    data-componentid={`${componentId}-name-error`}
                                />
                            )}
                            <Hint>
                                A unique name to identify this presentation definition in the admin console.
                            </Hint>
                        </Grid.Column>
                    </Grid.Row>

                    {/* Purpose Field */}
                    <Grid.Row columns={1}>
                        <Grid.Column mobile={16} tablet={16} computer={10}>
                            <Field.Textarea
                                ariaLabel="Purpose"
                                name="purpose"
                                label="Purpose"
                                required={true}
                                placeholder={DEFAULT_PURPOSE}
                                value={formData.purpose}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                                    onChange({ purpose: e.target.value });
                                }}
                                maxLength={500}
                                minLength={0}
                                data-componentid={`${componentId}-purpose-input`}
                            />
                            {getWarning("purpose") && (
                                <Message
                                    type="warning"
                                    content={getWarning("purpose")}
                                    data-componentid={`${componentId}-purpose-warning`}
                                />
                            )}
                            <Hint>
                                This text is shown to users in their wallet when requesting credentials.
                                Make it clear and user-friendly.
                            </Hint>
                        </Grid.Column>
                    </Grid.Row>

                    {/* Description Field (Optional) */}
                    <Grid.Row columns={1}>
                        <Grid.Column mobile={16} tablet={16} computer={10}>
                            <Field.Textarea
                                ariaLabel="Description"
                                name="description"
                                label="Description (Optional)"
                                required={false}
                                placeholder="Internal notes about this definition..."
                                value={formData.description || ""}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                                    onChange({ description: e.target.value });
                                }}
                                maxLength={1000}
                                minLength={0}
                                data-componentid={`${componentId}-description-input`}
                            />
                            <Hint>
                                Internal description for administrators. Not shown to users.
                            </Hint>
                        </Grid.Column>
                    </Grid.Row>
                </Grid>
            </Form>
        </div>
    );
};

export default BasicInfoStep;
