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
import {
    ApplicationInterface,
    AuthenticationSequenceInterface,
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

    // State variables
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [presentationDefinitionId, setPresentationDefinitionId] = useState<string>("");
    const [isLoadingMapping, setIsLoadingMapping] = useState<boolean>(true);
    const [currentMappedDefinitionName, setCurrentMappedDefinitionName] = useState<string>("");

    const {
        data: presentationDefinitions,
        isLoading: isPresentationDefinitionsLoading,
        error: presentationDefinitionsError
    } = useGetPresentationDefinitions();

    /**
     * Find the OpenID4VP authenticator in the authentication sequence.
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
     */
    const getAuthenticatorProperty = (authenticator: any, propertyName: string): string | undefined => {
        if (!authenticator?.properties) {
            return undefined;
        }

        const property = authenticator.properties.find((prop: any) => prop.name === propertyName);

        return property?.value;
    };

    /**
     * Load application-specific presentation definition mapping.
     */
    useEffect(() => {
        if (!application?.id) {
            return;
        }

        setIsLoadingMapping(true);

        getApplicationPresentationDefinitionMapping(application.id)
            .then((mapping) => {
                if (mapping?.presentationDefinitionId) {
                    setPresentationDefinitionId(mapping.presentationDefinitionId);
                } else {
                    const openid4vpAuthenticator = findOpenID4VPAuthenticator(application.authenticationSequence);
                    if (openid4vpAuthenticator) {
                        const presentationDefId = getAuthenticatorProperty(
                            openid4vpAuthenticator,
                            "PresentationDefinitionId"
                        );
                        setPresentationDefinitionId(presentationDefId || "");
                    }
                }
            })
            .catch(() => {
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
     * Handle form submit.
     */
    const handleFormSubmit = (values: any): void => {
        setIsSubmitting(true);

        const selectedPresentationDefinitionId = values.presentationDefinitionId || "";

        const mappingPromise = selectedPresentationDefinitionId
            ? createOrUpdateApplicationPresentationDefinitionMapping(
                application.id,
                selectedPresentationDefinitionId
            )
            : deleteApplicationPresentationDefinitionMapping(application.id);

        mappingPromise
            .then(() => {
                const selectedDefinition = presentationDefinitions?.find(
                    (def: PresentationDefinitionInterface) => def.definitionId === selectedPresentationDefinitionId
                );

                const definitionName = selectedDefinition?.name || selectedPresentationDefinitionId;

                setPresentationDefinitionId(selectedPresentationDefinitionId);
                setCurrentMappedDefinitionName(definitionName);

                dispatch(addAlert({
                    description: selectedPresentationDefinitionId
                        ? `Presentation definition "${definitionName}" has been mapped to this application.`
                        : "Presentation definition mapping has been removed.",
                    level: AlertLevels.SUCCESS,
                    message: t("applications:notifications.updateApplication.success.message")
                }));

                onUpdate(application.id);
            })
            .catch((error: any) => {
                const errorDescription = error?.response?.data?.description ||
                    error?.response?.data?.error_description ||
                    t("applications:notifications.updateApplication.error.description");

                dispatch(addAlert({
                    description: errorDescription,
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

    const getCurrentMappedDefinitionDisplay = (): string => {
        if (!presentationDefinitionId) {
            return "No presentation definition configured";
        }

        if (currentMappedDefinitionName) {
            return currentMappedDefinitionName;
        }

        const definition = presentationDefinitions?.find(
            (def: PresentationDefinitionInterface) => def.definitionId === presentationDefinitionId
        );

        return definition?.name || presentationDefinitionId;
    };

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
                                <Hint>
                                    Presentation definitions can be created and configured in the
                                    Verifiable Credentials section, including DID method settings.
                                </Hint>
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
