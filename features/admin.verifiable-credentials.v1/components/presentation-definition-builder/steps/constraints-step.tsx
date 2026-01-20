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
import { Button, Card, Checkbox, Dropdown, Form, Grid, Icon, Input, Table } from "semantic-ui-react";
import {
    COMMON_CLAIM_FIELDS,
    CONSTRAINT_OPERATOR_LABELS,
    ConstraintOperator
} from "../../../constants/presentation-definition-constants";
import {
    ClaimConstraint,
    createClaimConstraint,
    CredentialRequirement,
    PresentationDefinitionFormData,
    ValidationError
} from "../../../models/presentation-definition-form";

/**
 * Props for ConstraintsStep component.
 */
interface ConstraintsStepProps extends IdentifiableComponentInterface {
    /** Current form data */
    formData: PresentationDefinitionFormData;
    /** Callback to update form data */
    onChange: (updates: Partial<PresentationDefinitionFormData>) => void;
    /** Validation errors */
    errors: ValidationError[];
}

/**
 * Step 4: Constraints Builder.
 * Add claim-level constraints for each credential.
 */
const ConstraintsStep: FunctionComponent<ConstraintsStepProps> = ({
    formData,
    onChange,
    errors,
    "data-componentid": componentId = "constraints-step"
}: ConstraintsStepProps): ReactElement => {

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
     * Adds a new claim constraint to a credential.
     */
    const addClaimConstraint = (credIndex: number) => {
        const credential = formData.credentials[credIndex];
        const newConstraint = createClaimConstraint();
        updateCredential(credIndex, {
            claimConstraints: [...credential.claimConstraints, newConstraint]
        });
    };

    /**
     * Updates a specific claim constraint.
     */
    const updateClaimConstraint = (
        credIndex: number,
        claimIndex: number,
        updates: Partial<ClaimConstraint>
    ) => {
        const credential = formData.credentials[credIndex];
        const updatedConstraints = credential.claimConstraints.map((c, i) =>
            i === claimIndex ? { ...c, ...updates } : c
        );
        updateCredential(credIndex, { claimConstraints: updatedConstraints });
    };

    /**
     * Removes a claim constraint.
     */
    const removeClaimConstraint = (credIndex: number, claimIndex: number) => {
        const credential = formData.credentials[credIndex];
        const filtered = credential.claimConstraints.filter((_, i) => i !== claimIndex);
        updateCredential(credIndex, { claimConstraints: filtered });
    };

    /**
     * Gets error for a claim constraint field.
     */
    const getClaimError = (
        credIndex: number,
        claimIndex: number,
        field: string
    ): string | undefined => {
        const error = errors.find(
            e => e.field === `credentials[${credIndex}].claimConstraints[${claimIndex}].${field}`
                && e.severity === "error"
        );
        return error?.message;
    };

    /**
     * Dropdown options for constraint operators.
     */
    const operatorOptions = Object.values(ConstraintOperator).map(op => ({
        key: op,
        text: CONSTRAINT_OPERATOR_LABELS[op],
        value: op
    }));

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
            {formData.credentials.map((credential, credIndex) => (
                <Card fluid key={credential.id} className="mb-4">
                    <Card.Content>
                        <Card.Header>
                            <Icon name="id card" />
                            {credential.name || credential.credentialType}
                        </Card.Header>
                        <Card.Meta>
                            Claim constraints for credentialSubject fields
                        </Card.Meta>
                    </Card.Content>
                    <Card.Content>
                        {credential.claimConstraints.length > 0 ? (
                            <Table basic="very" compact>
                                <Table.Header>
                                    <Table.Row>
                                        <Table.HeaderCell>Field Name</Table.HeaderCell>
                                        <Table.HeaderCell>Operator</Table.HeaderCell>
                                        <Table.HeaderCell>Value</Table.HeaderCell>
                                        <Table.HeaderCell>Required</Table.HeaderCell>
                                        <Table.HeaderCell width={1}></Table.HeaderCell>
                                    </Table.Row>
                                </Table.Header>
                                <Table.Body>
                                    {credential.claimConstraints.map((claim, claimIndex) => (
                                        <Table.Row key={claim.id}>
                                            {/* Field Name */}
                                            <Table.Cell>
                                                <Input
                                                    size="small"
                                                    list={`${componentId}-field-options-${credIndex}-${claimIndex}`}
                                                    placeholder="e.g., email"
                                                    value={claim.fieldName}
                                                    onChange={(e) => updateClaimConstraint(
                                                        credIndex,
                                                        claimIndex,
                                                        { fieldName: e.target.value }
                                                    )}
                                                    error={!!getClaimError(credIndex, claimIndex, "fieldName")}
                                                    data-componentid={`${componentId}-field-${credIndex}-${claimIndex}`}
                                                />
                                                <datalist id={`${componentId}-field-options-${credIndex}-${claimIndex}`}>
                                                    {COMMON_CLAIM_FIELDS.map(field => (
                                                        <option key={field} value={field} />
                                                    ))}
                                                </datalist>
                                            </Table.Cell>

                                            {/* Operator */}
                                            <Table.Cell>
                                                <Dropdown
                                                    compact
                                                    selection
                                                    options={operatorOptions}
                                                    value={claim.operator}
                                                    onChange={(_, { value }) => updateClaimConstraint(
                                                        credIndex,
                                                        claimIndex,
                                                        { operator: value as ConstraintOperator }
                                                    )}
                                                    data-componentid={`${componentId}-operator-${credIndex}-${claimIndex}`}
                                                />
                                            </Table.Cell>

                                            {/* Value (only for equals/contains/oneOf) */}
                                            <Table.Cell>
                                                {claim.operator !== ConstraintOperator.EXISTS ? (
                                                    <Input
                                                        size="small"
                                                        placeholder={
                                                            claim.operator === ConstraintOperator.ONE_OF
                                                                ? "value1, value2"
                                                                : "value"
                                                        }
                                                        value={
                                                            Array.isArray(claim.value)
                                                                ? claim.value.join(", ")
                                                                : claim.value || ""
                                                        }
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            updateClaimConstraint(credIndex, claimIndex, {
                                                                value: claim.operator === ConstraintOperator.ONE_OF
                                                                    ? val.split(",").map(v => v.trim())
                                                                    : val
                                                            });
                                                        }}
                                                        data-componentid={`${componentId}-value-${credIndex}-${claimIndex}`}
                                                    />
                                                ) : (
                                                    <span className="text-secondary">N/A</span>
                                                )}
                                            </Table.Cell>

                                            {/* Required Checkbox */}
                                            <Table.Cell textAlign="center">
                                                <Checkbox
                                                    checked={claim.isRequired}
                                                    onChange={(_, { checked }) => updateClaimConstraint(
                                                        credIndex,
                                                        claimIndex,
                                                        { isRequired: !!checked }
                                                    )}
                                                    data-componentid={`${componentId}-required-${credIndex}-${claimIndex}`}
                                                />
                                            </Table.Cell>

                                            {/* Remove Button */}
                                            <Table.Cell>
                                                <Button
                                                    icon="trash"
                                                    basic
                                                    negative
                                                    size="mini"
                                                    onClick={() => removeClaimConstraint(credIndex, claimIndex)}
                                                    data-componentid={`${componentId}-remove-${credIndex}-${claimIndex}`}
                                                />
                                            </Table.Cell>
                                        </Table.Row>
                                    ))}
                                </Table.Body>
                            </Table>
                        ) : (
                            <Message info>
                                No claim constraints defined. The credential type constraint is automatically added.
                            </Message>
                        )}

                        <Button
                            basic
                            primary
                            size="small"
                            className="mt-3"
                            onClick={() => addClaimConstraint(credIndex)}
                            data-componentid={`${componentId}-add-claim-${credIndex}`}
                        >
                            <Icon name="add" />
                            Add Claim Constraint
                        </Button>
                    </Card.Content>
                </Card>
            ))}

            <Hint className="mt-4">
                <strong>Claim constraints</strong> filter credentials based on their credentialSubject fields.
                <br />
                • <strong>Equals</strong>: Exact match required
                <br />
                • <strong>Contains</strong>: Value must contain the pattern
                <br />
                • <strong>Exists</strong>: Field must be present (any value)
                <br />
                • <strong>One of</strong>: Value must match one of the listed values
            </Hint>
        </div>
    );
};

export default ConstraintsStep;
