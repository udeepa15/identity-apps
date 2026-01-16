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
    PresentationDefinitionInterface,
    useGetPresentationDefinitions
} from "@wso2is/admin.verifiable-credentials.v1";
import { AlertLevels, IdentifiableComponentInterface } from "@wso2is/core/models";
import { addAlert } from "@wso2is/core/store";
import { Field, Form } from "@wso2is/form";
import { EmphasizedSegment, Hint } from "@wso2is/react-components";
import React, { FunctionComponent, ReactElement, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { Dispatch } from "redux";
import { Divider, Grid } from "semantic-ui-react";
import { updateApplicationDetails } from "../../api/application";
import {
    ApplicationInterface,
    AuthenticationSequenceInterface,
    AuthenticationStepInterface,
    AuthenticatorInterface
} from "../../models/application";

/**
 * Proptypes for the verifiable credentials settings component.
 */
interface VerifiableCredentialsSettingsPropsInterface extends IdentifiableComponentInterface {
    /**
     * Application object.
     */
    application: ApplicationInterface;
    /**
     * Callback to update the application details.
     */
    onUpdate: (id: string) => void;
    /**
     * Make the form read only.
     */
    readOnly?: boolean;
}

const OPENID4VP_AUTHENTICATOR_NAME = "OpenID4VPAuthenticator";

/**
 * Verifiable Credentials settings component.
 *
 * @param props - Props injected to the component.
 * @returns Verifiable Credentials settings component.
 */
export const VerifiableCredentialsSettings: FunctionComponent<VerifiableCredentialsSettingsPropsInterface> = (
    props: VerifiableCredentialsSettingsPropsInterface
): ReactElement => {

    const {
        application,
        onUpdate,
        readOnly,
        ["data-componentid"]: componentId = "verifiable-credentials-settings"
    } = props;

    const { t } = useTranslation();
    const dispatch: Dispatch = useDispatch();

    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [presentationDefinitionId, setPresentationDefinitionId] = useState<string>("");

    console.log("VerifiableCredentialsSettings: Component rendering", { application });

    const {
        data: presentationDefinitions,
        isLoading: isPresentationDefinitionsLoading,
        error: presentationDefinitionsError
    } = useGetPresentationDefinitions();

    console.log("VerifiableCredentialsSettings: Hook data", {
        presentationDefinitions,
        isPresentationDefinitionsLoading,
        presentationDefinitionsError
    });

    /**
     * Extract the presentation definition ID from the authentication sequence.
     */
    useEffect(() => {
        console.log("VerifiableCredentialsSettings: useEffect triggered", {
            hasAuthSequence: !!application?.authenticationSequence,
            hasSteps: !!application?.authenticationSequence?.steps
        });

        if (!application?.authenticationSequence?.steps) {
            return;
        }

        const openid4vpAuthenticator = findOpenID4VPAuthenticator(application.authenticationSequence);

        console.log("VerifiableCredentialsSettings: Found authenticator", { openid4vpAuthenticator });

        if (openid4vpAuthenticator) {
            const presentationDefId = getAuthenticatorProperty(
                openid4vpAuthenticator,
                "PresentationDefinitionId"
            );

            console.log("VerifiableCredentialsSettings: Setting presentation definition ID", { presentationDefId });
            setPresentationDefinitionId(presentationDefId || "");
        }
    }, [application]);

    /**
     * Find the OpenID4VP authenticator in the authentication sequence.
     *
     * @param authSequence - Authentication sequence.
     * @returns OpenID4VP authenticator or undefined.
     */
    const findOpenID4VPAuthenticator = (authSequence: AuthenticationSequenceInterface): any => {
        if (!authSequence?.steps) {
            return undefined;
        }

        for (const step of authSequence.steps) {
            const authenticator = step.options?.find(
                (option: AuthenticatorInterface) => option.authenticator === OPENID4VP_AUTHENTICATOR_NAME
            );

            if (authenticator) {
                return authenticator;
            }
        }

        return undefined;
    };

    /**
     * Get a property value from the authenticator.
     *
     * @param authenticator - Authenticator object.
     * @param propertyName - Property name.
     * @returns Property value or undefined.
     */
    const getAuthenticatorProperty = (authenticator: any, propertyName: string): string | undefined => {
        if (!authenticator?.properties) {
            return undefined;
        }

        const property = authenticator.properties.find((prop: any) => prop.name === propertyName);

        return property?.value;
    };

    /**
     * Update the authenticator property in the authentication sequence.
     *
     * @param authSequence - Authentication sequence.
     * @param propertyName - Property name.
     * @param propertyValue - Property value.
     * @returns Updated authentication sequence.
     */
    const updateAuthenticatorProperty = (
        authSequence: AuthenticationSequenceInterface,
        propertyName: string,
        propertyValue: string
    ): AuthenticationSequenceInterface => {
        if (!authSequence?.steps) {
            return authSequence;
        }

        const updatedSteps = authSequence.steps.map((step: AuthenticationStepInterface) => {
            const updatedOptions = step.options?.map((option: any) => {
                if (option.authenticator === OPENID4VP_AUTHENTICATOR_NAME) {
                    const properties = option.properties || [];
                    const existingPropertyIndex = properties.findIndex(
                        (prop: any) => prop.name === propertyName
                    );

                    if (existingPropertyIndex >= 0) {
                        properties[existingPropertyIndex].value = propertyValue;
                    } else {
                        properties.push({
                            name: propertyName,
                            value: propertyValue
                        });
                    }

                    return {
                        ...option,
                        properties
                    };
                }

                return option;
            });

            return {
                ...step,
                options: updatedOptions
            };
        });

        return {
            ...authSequence,
            steps: updatedSteps
        };
    };

    /**
     * Handle form submit.
     *
     * @param values - Form values.
     */
    /**
     * Handle form submit.
     *
     * @param values - Form values.
     */
    const handleFormSubmit = (values: any): void => {
        setIsSubmitting(true);

        const selectedPresentationDefinitionId = values.presentationDefinitionId || "";

        // Find which step contains the OpenID4VP authenticator
        let openIDVPStepIndex = 1; // Default to 1
        let found = false;

        // Helper map to store step-specific configs
        const stepSpecificConfigs: { [key: number]: any } = {};

        if (application.authenticationSequence?.steps) {
            application.authenticationSequence.steps.forEach((step: AuthenticationStepInterface) => {
                if (found) return;
                const hasOpenIDVP = step.options?.some(
                    (opt: AuthenticatorInterface) => opt.authenticator === OPENID4VP_AUTHENTICATOR_NAME
                );
                if (hasOpenIDVP) {
                    openIDVPStepIndex = step.id;
                    found = true;
                }
            });
        }

        // Generate Adaptive Auth Script
        // We use a script because the API does not support configuring local authenticator properties 
        // directly in the step options payload.
        const adaptiveScript = `
var onLoginRequest = function(context) {
    executeStep(${openIDVPStepIndex}, {
        authenticatorParams: {
            local: {
                OpenID4VPAuthenticator: {
                    PresentationDefinitionId: "${selectedPresentationDefinitionId}"
                }
            }
        }
    }, {});
};`;

        // Sanitize steps: strictly REMOVE properties from options to avoid "Unexpected format" API error
        const sanitizedSteps = application.authenticationSequence.steps?.map((step: AuthenticationStepInterface) => {
            return {
                id: step.id,
                options: step.options?.map((option: any) => {
                    // Return strictly minimal option object
                    return {
                        authenticator: option.authenticator,
                        idp: option.idp
                    };
                })
            };
        });

        const payloadAuthenticationSequence = {
            attributeStepId: application.authenticationSequence.attributeStepId,
            requestPathAuthenticators: application.authenticationSequence.requestPathAuthenticators || [],
            script: adaptiveScript, // Set the script
            steps: sanitizedSteps,
            subjectStepId: application.authenticationSequence.subjectStepId,
            type: application.authenticationSequence.type || "USER_DEFINED"
        };

        // Remove script if it is explicitly undefined in our logic (though we just set it above)
        // But for safety, cleaner payload
        if (!payloadAuthenticationSequence.script) {
            delete payloadAuthenticationSequence.script;
        }

        const updatedApplication = {
            id: application.id,
            authenticationSequence: payloadAuthenticationSequence
        };

        console.log("handleFormSubmit: Generating Adaptive Script", { adaptiveScript });
        console.log("handleFormSubmit: Debugging payload (JSON)", JSON.stringify(updatedApplication, null, 2));

        // Cast to unknown then ApplicationInterface to bypass strict type checking for partial updates
        updateApplicationDetails(updatedApplication as unknown as ApplicationInterface)
            .then(() => {
                console.log("handleFormSubmit: Update successful");
                dispatch(addAlert({
                    description: t("applications:notifications.updateApplication.success.description"),
                    level: AlertLevels.SUCCESS,
                    message: t("applications:notifications.updateApplication.success.message")
                }));
                onUpdate(application.id);
            })
            .catch((error: any) => {
                console.error("handleFormSubmit: Update failed", error);

                let errorDetails = "Unknown Error";
                if (error?.response?.data) {
                    try {
                        errorDetails = JSON.stringify(error.response.data, null, 2);
                    } catch (e) {
                        errorDetails = error.response.data;
                    }
                }
                console.error("handleFormSubmit: API Error Response Body:", errorDetails);

                dispatch(addAlert({
                    description: error?.response?.data?.description ||
                        t("applications:notifications.updateApplication.error.description"),
                    level: AlertLevels.ERROR,
                    message: t("applications:notifications.updateApplication.error.message")
                }));
            })
            .finally(() => {
                setIsSubmitting(false);
            });
    };

    const presentationDefinitionOptions = useMemo(() => {
        if (!presentationDefinitions) {
            return [];
        }

        return (presentationDefinitions as any[]).map((definition: PresentationDefinitionInterface) => {
            return {
                key: definition.definitionId,
                text: definition.name || definition.definitionId,
                value: definition.definitionId
            };
        });
    }, [presentationDefinitions]);

    console.log("VerifiableCredentialsSettings: Rendering UI", {
        presentationDefinitionOptions,
        presentationDefinitionId
    });

    if (presentationDefinitionsError) {
        return (
            <EmphasizedSegment padded="very">
                <Grid>
                    <Grid.Row columns={1}>
                        <Grid.Column>
                            <h3>Error Loading Presentation Definitions</h3>
                            <p>Failed to load presentation definitions. Please check the console for details.</p>
                        </Grid.Column>
                    </Grid.Row>
                </Grid>
            </EmphasizedSegment>
        );
    }

    return (
        <>
            <EmphasizedSegment padded="very">
                <Grid>
                    <Grid.Row columns={1}>
                        <Grid.Column>
                            <h3>Presentation Definition Configuration</h3>
                            <Hint>
                                Select a presentation definition to use for OpenID4VP authentication.
                                This defines what verifiable credentials will be requested from users.
                            </Hint>
                        </Grid.Column>
                    </Grid.Row>
                </Grid>
                <Divider hidden />
                <Form
                    id={`${componentId}-form`}
                    onSubmit={handleFormSubmit}
                    uncontrolledForm={true}
                    initialValues={{
                        presentationDefinitionId: presentationDefinitionId
                    }}
                >
                    <Grid>
                        <Grid.Row columns={1}>
                            <Grid.Column mobile={16} tablet={16} computer={10}>
                                <Field.Dropdown
                                    ariaLabel="Presentation Definition"
                                    name="presentationDefinitionId"
                                    label="Presentation Definition"
                                    placeholder="Select a Presentation Definition"
                                    options={presentationDefinitionOptions}
                                    loading={isPresentationDefinitionsLoading}
                                    required={false}
                                    readOnly={readOnly}
                                    data-componentid={`${componentId}-presentation-definition-dropdown`}
                                />
                            </Grid.Column>
                        </Grid.Row>
                        <Grid.Row columns={1}>
                            <Grid.Column mobile={16} tablet={16} computer={10}>
                                <Field.Button
                                    form={`${componentId}-form`}
                                    size="small"
                                    buttonType="primary_btn"
                                    ariaLabel="submit"
                                    name="submit"
                                    loading={isSubmitting}
                                    disabled={readOnly}
                                    label={t("common:update")}
                                    data-componentid={`${componentId}-submit-button`}
                                />
                            </Grid.Column>
                        </Grid.Row>
                    </Grid>
                </Form>
            </EmphasizedSegment>
        </>
    );
};
