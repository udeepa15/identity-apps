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
import { Heading } from "@wso2is/react-components";
import React, { FunctionComponent, ReactElement, useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, Grid, Icon, Segment, Step } from "semantic-ui-react";
import { WIZARD_STEP_LABELS, WizardStep } from "../../constants/presentation-definition-constants";
import {
    createCredentialRequirement,
    DEFAULT_FORM_DATA,
    PresentationDefinitionFormData,
    ValidationError
} from "../../models/presentation-definition-form";
import { generatePresentationDefinitionString } from "../../utils/json-generator";
import { hasBlockingErrors, validateForm } from "../../utils/validation";
import BasicInfoStep from "./steps/basic-info-step";
import ConstraintsStep from "./steps/constraints-step";
import CredentialRequirementsStep from "./steps/credential-requirements-step";
import FormatProofStep from "./steps/format-proof-step";
import PreviewStep from "./steps/preview-step";

/**
 * Props for the Presentation Definition Wizard.
 */
interface PresentationDefinitionWizardProps extends IdentifiableComponentInterface {
    /** Initial form data (for editing existing definitions) */
    initialData?: PresentationDefinitionFormData;
    /** Callback when wizard is cancelled */
    onCancel: () => void;
    /** Callback when wizard is submitted with generated JSON */
    onSubmit: (name: string, description: string, json: string, didMethod: string, signingAlgorithm: string) => void;
    /** Text for the submit button (default: "Create Definition") */
    submitButtonText?: string;
    /** Whether submission is in progress */
    isSubmitting?: boolean;
}

/**
 * Wizard component for building Presentation Definitions.
 */
const PresentationDefinitionWizard: FunctionComponent<PresentationDefinitionWizardProps> = ({
    initialData,
    onCancel,
    onSubmit,
    submitButtonText = "Create Definition",
    isSubmitting = false,
    "data-componentid": componentId = "presentation-definition-wizard"
}: PresentationDefinitionWizardProps): ReactElement => {
    const { t } = useTranslation();

    // Form state
    const [formData, setFormData] = useState<PresentationDefinitionFormData>(
        initialData || { ...DEFAULT_FORM_DATA }
    );

    // Wizard navigation state
    const [currentStep, setCurrentStep] = useState<number>(WizardStep.BASIC_INFO);
    const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

    // Validation state
    const [errors, setErrors] = useState<ValidationError[]>([]);

    /**
     * Updates form data and clears related errors.
     */
    const updateFormData = useCallback((updates: Partial<PresentationDefinitionFormData>) => {
        setFormData(prev => ({ ...prev, ...updates }));
    }, []);

    /**
     * Validates current step and returns whether it's valid.
     */
    const validateCurrentStep = useCallback((): boolean => {
        const allErrors = validateForm(formData);
        setErrors(allErrors);

        // Check if current step has blocking errors
        const stepErrors = allErrors.filter(e => {
            switch (currentStep) {
                case WizardStep.BASIC_INFO:
                    return e.field === "name" || e.field === "description" || e.field === "purpose";
                case WizardStep.CREDENTIALS:
                    return e.field === "credentials" || e.field.includes(".credentialType");
                case WizardStep.FORMAT:
                    return e.field.includes(".format") || e.field.includes(".proofAlgorithm");
                case WizardStep.CONSTRAINTS:
                    return e.field.includes(".claimConstraints");
                default:
                    return false;
            }
        });

        return !hasBlockingErrors(stepErrors);
    }, [currentStep, formData]);

    /**
     * Moves to the next step if validation passes.
     */
    const handleNext = useCallback(() => {
        if (validateCurrentStep()) {
            setCompletedSteps(prev => new Set([...prev, currentStep]));
            setCurrentStep(prev => Math.min(prev + 1, WizardStep.PREVIEW));
        }
    }, [currentStep, validateCurrentStep]);

    /**
     * Moves to the previous step.
     */
    const handlePrevious = useCallback(() => {
        setCurrentStep(prev => Math.max(prev - 1, WizardStep.BASIC_INFO));
    }, []);

    /**
     * Handles wizard submission.
     */
    const handleSubmit = useCallback(() => {
        const allErrors = validateForm(formData);
        setErrors(allErrors);

        if (!hasBlockingErrors(allErrors)) {
            const jsonString = generatePresentationDefinitionString(formData);
            onSubmit(
                formData.name,
                formData.description || "",
                jsonString,
                formData.didMethod || "web",
                formData.signingAlgorithm || "RS256"
            );
        }
    }, [formData, onSubmit]);

    /**
     * Navigates to a specific step (from step indicator).
     */
    const goToStep = useCallback((step: number) => {
        // Only allow navigation to completed steps or adjacent step
        if (completedSteps.has(step) || step === currentStep + 1 || step < currentStep) {
            setCurrentStep(step);
        }
    }, [completedSteps, currentStep]);

    /**
     * Generated JSON for preview.
     */
    const generatedJson = useMemo(() => {
        try {
            return generatePresentationDefinitionString(formData);
        } catch {
            return "// Error generating JSON";
        }
    }, [formData]);

    /**
     * Renders the current step content.
     */
    const renderStepContent = (): ReactElement => {
        switch (currentStep) {
            case WizardStep.BASIC_INFO:
                return (
                    <BasicInfoStep
                        formData={formData}
                        onChange={updateFormData}
                        errors={errors}
                        data-componentid={`${componentId}-basic-info-step`}
                    />
                );
            case WizardStep.CREDENTIALS:
                return (
                    <CredentialRequirementsStep
                        formData={formData}
                        onChange={updateFormData}
                        errors={errors}
                        data-componentid={`${componentId}-credentials-step`}
                    />
                );
            case WizardStep.FORMAT:
                return (
                    <FormatProofStep
                        formData={formData}
                        onChange={updateFormData}
                        errors={errors}
                        data-componentid={`${componentId}-format-step`}
                    />
                );
            case WizardStep.CONSTRAINTS:
                return (
                    <ConstraintsStep
                        formData={formData}
                        onChange={updateFormData}
                        errors={errors}
                        data-componentid={`${componentId}-constraints-step`}
                    />
                );
            case WizardStep.PREVIEW:
                return (
                    <PreviewStep
                        formData={formData}
                        generatedJson={generatedJson}
                        errors={errors}
                        data-componentid={`${componentId}-preview-step`}
                    />
                );
            default:
                return <div>Unknown step</div>;
        }
    };

    /**
     * Renders the step indicator.
     */
    const renderStepIndicator = (): ReactElement => {
        return (
            <Step.Group ordered fluid data-componentid={`${componentId}-steps`}>
                {WIZARD_STEP_LABELS.map((label, index) => (
                    <Step
                        key={index}
                        active={currentStep === index}
                        completed={completedSteps.has(index) && currentStep !== index}
                        disabled={!completedSteps.has(index) && index > currentStep}
                        data-componentid={`${componentId}-step-${index}`}
                    >
                        <Step.Content>
                            <Step.Title>{label}</Step.Title>
                        </Step.Content>
                    </Step>
                ))}
            </Step.Group>
        );
    };

    return (
        <div className="presentation-definition-wizard" data-componentid={componentId}>
            {/* Step Indicator */}
            <Segment basic>
                {renderStepIndicator()}
            </Segment>

            {/* Step Content */}
            <Segment padded="very">
                <Heading as="h4" className="mb-4">
                    {WIZARD_STEP_LABELS[currentStep]}
                </Heading>
                {renderStepContent()}
            </Segment>

            {/* Navigation Buttons */}
            <Segment basic>
                <Grid>
                    <Grid.Row>
                        <Grid.Column width={8}>
                            <Button
                                basic
                                onClick={onCancel}
                                data-componentid={`${componentId}-cancel-button`}
                            >
                                Cancel
                            </Button>
                        </Grid.Column>
                        <Grid.Column width={8} textAlign="right">
                            {currentStep > WizardStep.BASIC_INFO && (
                                <Button
                                    basic
                                    onClick={handlePrevious}
                                    data-componentid={`${componentId}-previous-button`}
                                >
                                    <Icon name="arrow left" />
                                    Previous
                                </Button>
                            )}
                            {currentStep < WizardStep.PREVIEW ? (
                                <Button
                                    primary
                                    onClick={handleNext}
                                    data-componentid={`${componentId}-next-button`}
                                >
                                    Next
                                    <Icon name="arrow right" />
                                </Button>
                            ) : (
                                <Button
                                    primary
                                    onClick={handleSubmit}
                                    loading={isSubmitting}
                                    disabled={isSubmitting}
                                    data-componentid={`${componentId}-submit-button`}
                                >
                                    <Icon name="check" />
                                    {submitButtonText}
                                </Button>
                            )}
                        </Grid.Column>
                    </Grid.Row>
                </Grid>
            </Segment>
        </div>
    );
};

export default PresentationDefinitionWizard;
