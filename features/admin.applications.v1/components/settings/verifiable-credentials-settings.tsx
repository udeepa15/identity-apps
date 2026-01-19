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
    useGetPresentationDefinitions,
    getApplicationPresentationDefinitionMapping,
    createOrUpdateApplicationPresentationDefinitionMapping,
    deleteApplicationPresentationDefinitionMapping
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
    const [isLoadingMapping, setIsLoadingMapping] = useState<boolean>(true);
    const [currentMappedDefinitionName, setCurrentMappedDefinitionName] = useState<string>("");

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
     * Load application-specific presentation definition mapping.
     */
    useEffect(() => {
        if (!application?.id) {
            return;
        }

        setIsLoadingMapping(true);

        console.log("VerifiableCredentialsSettings: Loading mapping for app", { applicationId: application.id });

        getApplicationPresentationDefinitionMapping(application.id)
            .then((mapping) => {
                if (mapping?.presentationDefinitionId) {
                    console.log("VerifiableCredentialsSettings: Found app-specific mapping", { mapping });
                    setPresentationDefinitionId(mapping.presentationDefinitionId);
                } else {
                    console.log("VerifiableCredentialsSettings: No app-specific mapping, checking authenticator config");
                    // Fall back to checking authenticator configuration
                    const openid4vpAuthenticator = findOpenID4VPAuthenticator(application.authenticationSequence);
                    if (openid4vpAuthenticator) {
                        const presentationDefId = getAuthenticatorProperty(
                            openid4vpAuthenticator,
                            "PresentationDefinitionId"
                        );
                        console.log("VerifiableCredentialsSettings: Found in authenticator config", { presentationDefId });
                        setPresentationDefinitionId(presentationDefId || "");
                    }
                }
            })
            .catch((error) => {
                console.error("VerifiableCredentialsSettings: Error loading mapping", error);
                // Fall back to checking authenticator configuration
                const openid4vpAuthenticator = findOpenID4VPAuthenticator(application.authenticationSequence);
                if (openid4vpAuthenticator) {
                    const presentationDefId = getAuthenticatorProperty(
                        openid4vpAuthenticator,
                        "PresentationDefinitionId"
                    );
                    setPresentationDefinitionId(presentationDefId || "");
                }
            })
            .finally(() => {
                setIsLoadingMapping(false);
            });
    }, [application?.id]);

    /**
     * Extract the presentation definition ID from the authentication sequence.
     */
    useEffect(() => {
        console.log("VerifiableCredentialsSettings: useEffect triggered", {
            hasAuthSequence: !!application?.authenticationSequence,
            hasSteps: !!application?.authenticationSequence?.steps
        });

        // This useEffect is now deprecated - mapping is loaded in the previous useEffect
        // Keeping it for backward compatibility in case mapping API fails
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
    const handleFormSubmit = (values: any): void => {
        setIsSubmitting(true);

        const selectedPresentationDefinitionId = values.presentationDefinitionId || "";

        console.log("handleFormSubmit: Using per-application mapping", {
            applicationId: application.id,
            presentationDefinitionId: selectedPresentationDefinitionId
        });

        // Use the new per-application mapping API
        const mappingPromise = selectedPresentationDefinitionId
            ? createOrUpdateApplicationPresentationDefinitionMapping(
                application.id,
                selectedPresentationDefinitionId
            )
            : deleteApplicationPresentationDefinitionMapping(application.id);

        console.log("handleFormSubmit: API Call initiated", {
            action: selectedPresentationDefinitionId ? "create/update" : "delete",
            appId: application.id,
            defId: selectedPresentationDefinitionId
        });

        mappingPromise
            .then(() => {
                console.log("handleFormSubmit: Mapping update successful");

                // Find the definition name from the list
                const selectedDefinition = presentationDefinitions?.find(
                    (def: PresentationDefinitionInterface) => def.definitionId === selectedPresentationDefinitionId
                );

                const definitionName = selectedDefinition?.name || selectedPresentationDefinitionId;

                // Update local state
                setPresentationDefinitionId(selectedPresentationDefinitionId);
                setCurrentMappedDefinitionName(definitionName);

                // Show success message with the definition name
                if (selectedPresentationDefinitionId) {
                    dispatch(addAlert({
                        description: `Presentation definition "${definitionName}" has been successfully mapped to this application.`,
                        level: AlertLevels.SUCCESS,
                        message: t("applications:notifications.updateApplication.success.message")
                    }));
                } else {
                    dispatch(addAlert({
                        description: "Presentation definition mapping has been removed. Application will use default or authenticator configuration.",
                        level: AlertLevels.SUCCESS,
                        message: t("applications:notifications.updateApplication.success.message")
                    }));
                    setCurrentMappedDefinitionName("");
                }

                // Trigger parent update callback
                onUpdate(application.id);
            })
            .catch((error: any) => {
                console.error("handleFormSubmit: Mapping update failed", error);

                let errorDetails = "Unknown Error";
                if (error?.response?.data) {
                    try {
                        errorDetails = JSON.stringify(error.response.data, null, 2);
                    } catch (e) {
                        errorDetails = error.response.data;
                    }
                }
                console.error("handleFormSubmit: API Error Response Body:", errorDetails);
                console.error("handleFormSubmit: Full Error Object:", error);

                if (error?.response) {
                    console.error("handleFormSubmit: Response Status:", error.response.status);
                    console.error("handleFormSubmit: Response Headers:", error.response.headers);
                }

                dispatch(addAlert({
                    description: error?.response?.data?.description ||
                        error?.response?.data?.error_description ||
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

    /**
     * Get the current mapped definition name.
     */
    const getCurrentMappedDefinitionDisplay = (): string => {
        if (!presentationDefinitionId) {
            return "No presentation definition configured";
        }

        if (currentMappedDefinitionName) {
            return currentMappedDefinitionName;
        }

        // Find from definitions list
        const definition = presentationDefinitions?.find(
            (def: PresentationDefinitionInterface) => def.definitionId === presentationDefinitionId
        );

        return definition?.name || presentationDefinitionId;
    };

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

                {/* Current Mapping Status */}
                {!isLoadingMapping && (
                    <Grid>
                        <Grid.Row columns={1}>
                            <Grid.Column mobile={16} tablet={16} computer={10}>
                                <div style={{
                                    backgroundColor: presentationDefinitionId ? "#f0f8ff" : "#fff3cd",
                                    padding: "12px",
                                    borderRadius: "4px",
                                    marginBottom: "20px",
                                    borderLeft: presentationDefinitionId ? "4px solid #0066cc" : "4px solid #ffc107"
                                }}>
                                    <strong>Currently Mapped Definition:</strong>
                                    <p style={{ margin: "8px 0 0 0", color: "#333" }}>
                                        {getCurrentMappedDefinitionDisplay()}
                                    </p>
                                </div>
                            </Grid.Column>
                        </Grid.Row>
                    </Grid>
                )}

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
                                    loading={isPresentationDefinitionsLoading || isLoadingMapping}
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
