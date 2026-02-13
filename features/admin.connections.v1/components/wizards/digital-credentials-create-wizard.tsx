/**
 * Copyright (c) 2024, WSO2 LLC. (https://www.wso2.com).
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

import { IdentityProviderInterface } from "@wso2is/admin.identity-providers.v1/models";
import { Heading, LinkButton, PrimaryButton, Steps } from "@wso2is/react-components";
import React, { FunctionComponent, ReactElement, useState } from "react";
import { useTranslation } from "react-i18next";
import { Modal } from "semantic-ui-react";
import { VerificationSettingsStep } from "./steps/verification-settings-step";
import { ConnectionTemplateInterface, GenericConnectionCreateWizardPropsInterface } from "../../models/connection";
import { GeneralSettings } from "./steps/shared-steps/general-settings";
import { createConnection } from "../../api/connections";
import { IdentifiableComponentInterface } from "@wso2is/core/models";
import { AxiosResponse } from "axios";

/**
 * Prop types for the Digital Credentials Create Wizard.
 */
interface DigitalCredentialsCreateWizardPropsInterface extends GenericConnectionCreateWizardPropsInterface, IdentifiableComponentInterface {
    template: ConnectionTemplateInterface;
}

/**
 * Digital Credentials Create Wizard component.
 *
 * @param props - Props injected to the component.
 * @returns React element.
 */
export const DigitalCredentialsCreateWizard: FunctionComponent<DigitalCredentialsCreateWizardPropsInterface> = (
    props: DigitalCredentialsCreateWizardPropsInterface
): ReactElement => {

    const {
        onWizardClose,
        onIDPCreate,
        template,
        [ "data-componentid" ]: componentId = "digital-credentials-create-wizard"
    } = props;

    const { t } = useTranslation();

    const [ currentStep, setCurrentStep ] = useState<number>(0);
    const [ wizardState, setWizardState ] = useState<Partial<IdentityProviderInterface>>({});
    const [ isSubmitting, setIsSubmitting ] = useState<boolean>(false);
    
    const [ finishSubmit, setFinishSubmit ] = useState<boolean>(false);
    const [ generalSettingsSubmit, setGeneralSettingsSubmit ] = useState<boolean>(false);

    /**
     * Handles the step change.
     *
     * @param nextStep - Next step to go to.
     */
    const changeStep = (nextStep: number): void => {
        if (currentStep === 0) {
            setGeneralSettingsSubmit(true);
        } else if (currentStep === 1) {
            setFinishSubmit(true);
        } else {
            setCurrentStep(nextStep);
        }
    };

    /**
     * Handles the general settings submit.
     *
     * @param values - Form values.
     */
    const handleGeneralSettingsSubmit = (values: any): void => {
        setGeneralSettingsSubmit(false);
        setWizardState({ ...wizardState, ...values });
        setCurrentStep(currentStep + 1);
    };

    /**
     * Handles the verification settings submit.
     *
     * @param values - Form values.
     */
    const handleVerificationSettingsSubmit = (values: any): void => {
        setFinishSubmit(false);
        const finalData = { ...wizardState, ...values };
        setWizardState(finalData);
        
        // Final submission
        handleWizardFormFinish(finalData);
    };

    /**
     * Handles the wizard finish.
     *
     * @param data - Final data.
     */
    const handleWizardFormFinish = (data: any): void => {
        setIsSubmitting(true);

        const identityProvider: IdentityProviderInterface = {
            ...data,
            image: template?.image,
            templateId: template?.templateId,
            federatedAuthenticators: {
                defaultAuthenticatorId: template?.idp?.federatedAuthenticators?.defaultAuthenticatorId,
                authenticators: [
                    {
                        authenticatorId: template?.idp?.federatedAuthenticators?.authenticators[0].authenticatorId,
                        properties: [
                            {
                                key: "presentationDefinition",
                                value: data.presentationDefinition
                            }
                        ]
                    }
                ]
            }
        };

        createConnection(identityProvider)
            .then((response: AxiosResponse) => {
                onIDPCreate(response.data.id);
            })
            .catch(() => {
                setIsSubmitting(false);
            });
    };

    const STEPS = [
        {
            content: (
                <GeneralSettings
                    triggerSubmit={ generalSettingsSubmit }
                    initialValues={ wizardState }
                    onSubmit={ handleGeneralSettingsSubmit }
                    template={ template }
                />
            ),
            icon: null,
            title: "General Settings"
        },
        {
            content: (
                <VerificationSettingsStep
                    triggerSubmit={ finishSubmit }
                    initialValues={ wizardState }
                    onSubmit={ handleVerificationSettingsSubmit }
                />
            ),
            icon: null,
            title: "Verification Settings"
        }
    ];

    return (
        <Modal
            open={ true }
            className="wizard"
            dimmer="blurring"
            size="small"
            onClose={ onWizardClose }
            closeOnDimmerClick={ false }
            closeOnEscape
            data-componentid={ componentId }
        >
            <Modal.Header className="wizard-header">
                { "New Connection" }
                <Heading as="h6">{ template?.name }</Heading>
            </Modal.Header>
            <Modal.Content className="steps-container">
                <Steps.Group
                    current={ currentStep }
                    className="steps"
                >
                    { STEPS.map((step, index) => (
                        <Steps.Step
                            key={ index }
                            title={ step.title }
                            number={ index + 1 }
                        />
                    )) }
                </Steps.Group>
            </Modal.Content>
            <Modal.Content className="content-container">
                { STEPS[ currentStep ].content }
            </Modal.Content>
            <Modal.Actions>
                <LinkButton
                    floated="left"
                    onClick={ () => onWizardClose() }
                >
                    { t("common:cancel") }
                </LinkButton>
                { currentStep > 0 && (
                    <LinkButton
                        floated="left"
                        onClick={ () => setCurrentStep(currentStep - 1) }
                    >
                        { t("common:previous") }
                    </LinkButton>
                ) }
                <PrimaryButton
                    onClick={ () => changeStep(currentStep + 1) }
                    data-componentid={ `${componentId}-next-button` }
                    loading={ isSubmitting }
                    disabled={ isSubmitting }
                >
                    { currentStep === STEPS.length - 1
                        ? t("common:finish")
                        : t("common:next")
                    }
                </PrimaryButton>
            </Modal.Actions>
        </Modal>
    );
};
