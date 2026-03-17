/**
 * Copyright (c) 2026, WSO2 LLC. (https://www.wso2.com).
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

import { ModalWithSidePanel } from "@wso2is/admin.core.v1/components/modals/modal-with-side-panel";
import useUIConfig from "@wso2is/admin.core.v1/hooks/use-ui-configs";
import { EventPublisher } from "@wso2is/admin.core.v1/utils/event-publisher";
import { AlertLevels, IdentifiableComponentInterface } from "@wso2is/core/models";
import { addAlert } from "@wso2is/core/store";
import { Field, Wizard2, WizardPage, composeValidators } from "@wso2is/form";
import {
    DocumentationLink,
    GenericIcon,
    Heading,
    LinkButton,
    PrimaryButton,
    useWizardAlert
} from "@wso2is/react-components";
import { AxiosError, AxiosResponse } from "axios";
import cloneDeep from "lodash-es/cloneDeep";
import get from "lodash-es/get";
import isEmpty from "lodash-es/isEmpty";
import React, { FunctionComponent, MutableRefObject, ReactElement, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { Dispatch } from "redux";
import { Grid as SemanticGrid } from "semantic-ui-react";
import CreateConnectionWizardHelp from "./create-wizard-help";
import {
    createConnection,
    createPresentationDefinition,
    CreatePresentationDefinitionRequestInterface,
    CreatePresentationDefinitionResponseInterface,
    PresentationDefinitionCredentialInterface
} from "../../api/connections";
import {
    ConnectionInterface,
    GenericConnectionCreateWizardPropsInterface
} from "../../models/connection";
import { ConnectionsManagementUtils } from "../../utils/connection-utils";

interface DigitalCredentialsConnectionCreateWizardPropsInterface extends
    GenericConnectionCreateWizardPropsInterface, IdentifiableComponentInterface {
}

interface DigitalCredentialWizardFormValuesInterface {
    name: string;
    vcIssuer: string;
    vcType: string;
}

interface WizardRefInterface {
    gotoNextPage: () => void;
}

export const DigitalCredentialsConnectionCreateWizard: FunctionComponent<
    DigitalCredentialsConnectionCreateWizardPropsInterface
> = (
    props: DigitalCredentialsConnectionCreateWizardPropsInterface
): ReactElement => {

    const {
        onWizardClose,
        onIDPCreate,
        title,
        subTitle,
        template,
        [ "data-componentid" ]: componentId = "digital-credentials"
    } = props;

    const { t } = useTranslation();
    const dispatch: Dispatch = useDispatch();
    const { UIConfig } = useUIConfig();

    const [ nextShouldBeDisabled, setNextShouldBeDisabled ] = useState<boolean>(false);
    const [ isSubmitting, setIsSubmitting ] = useState<boolean>(false);
    const [ alert, setAlert, alertComponent ] = useWizardAlert();

    const wizardRef: MutableRefObject<WizardRefInterface> = useRef<WizardRefInterface>(null);
    const eventPublisher: EventPublisher = EventPublisher.getInstance();

    const initialValues: DigitalCredentialWizardFormValuesInterface = {
        name: "Digital Credentials",
        vcIssuer: "did:web:masked-unprofitably-ardith.ngrok-free.dev",
        vcType: "EmployeeBadge"
    };

    const resolveConnectionIcon = (): string => {
        return ConnectionsManagementUtils.resolveConnectionResourcePath("", template?.image);
    };

    const extractPresentationDefinitionId = (
        response: AxiosResponse<CreatePresentationDefinitionResponseInterface>
    ): string => {
        const idFromBody: string = get(response, "data.id") as string;

        if (!isEmpty(idFromBody)) {
            return idFromBody;
        }

        const locationHeader: string = response?.headers?.location;

        if (!isEmpty(locationHeader)) {
            return locationHeader.substring(locationHeader.lastIndexOf("/") + 1);
        }

        throw new Error("Presentation definition ID is missing in the create response.");
    };

    const createConnectionFromValues = async (values: DigitalCredentialWizardFormValuesInterface): Promise<void> => {
        const credentials: PresentationDefinitionCredentialInterface[] = [
            {
                claims: [],
                issuer: values.vcIssuer,
                purpose: "Please share your verifiable credential.",
                type: values.vcType
            }
        ];

        const presentationDefinitionName: string = values.name;

        const pdRequest: CreatePresentationDefinitionRequestInterface = {
            credentials,
            name: presentationDefinitionName
        };

        console.log("[Digital Credentials] Presentation Definition create payload:", pdRequest);

        const createPDResponse: AxiosResponse<CreatePresentationDefinitionResponseInterface> =
            await createPresentationDefinition(pdRequest);
        console.log("[Digital Credentials] Presentation Definition create response:", createPDResponse?.data);

        const presentationDefinitionId: string = extractPresentationDefinitionId(createPDResponse);

        const connection: ConnectionInterface = cloneDeep(template.idp);

        connection.name = values.name;
        connection.description = "";
        connection.templateId = template.templateId;

        connection.federatedAuthenticators.authenticators[ 0 ].properties = [
            {
                key: "presentationDefinitionId",
                value: presentationDefinitionId
            }
        ];

        if (!isEmpty(UIConfig?.connectionResourcesUrl)) {
            connection.image = UIConfig.connectionResourcesUrl + template.image;
        } else {
            connection.image = resolveConnectionIcon();
        }

        console.log("[Digital Credentials] Connection create payload:", connection);

        const response: AxiosResponse<ConnectionInterface> = await createConnection(connection);
        console.log("[Digital Credentials] Connection create response:", response?.data);

        eventPublisher.publish("connections-finish-adding-connection", {
            type: componentId
        });

        dispatch(addAlert({
            description: t("authenticationProvider:notifications.addIDP.success.description"),
            level: AlertLevels.SUCCESS,
            message: t("authenticationProvider:notifications.addIDP.success.message")
        }));

        if (!isEmpty(response.headers.location)) {
            const location: string = response.headers.location;
            const createdIdpID: string = location.substring(location.lastIndexOf("/") + 1);

            onIDPCreate(createdIdpID);

            return;
        }

        onIDPCreate();
    };

    const handleFormSubmit = async (values: DigitalCredentialWizardFormValuesInterface): Promise<void> => {
        setIsSubmitting(true);

        try {
            await createConnectionFromValues(values);
        } catch (error) {
            const axiosError: AxiosError = error as AxiosError;

            setAlert({
                description: axiosError?.response?.data?.description
                    ? t("authenticationProvider:notifications.addIDP.error.description", {
                        description: axiosError.response.data.description
                    })
                    : t("authenticationProvider:notifications.addIDP.genericError.description"),
                level: AlertLevels.ERROR,
                message: axiosError?.response?.data?.description
                    ? t("authenticationProvider:notifications.addIDP.error.message")
                    : t("authenticationProvider:notifications.addIDP.genericError.message")
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const singlePage = (): ReactElement => (
        <WizardPage
            validate={ (values: DigitalCredentialWizardFormValuesInterface) => {
                const errors: Record<string, string> = {};

                errors.name = composeValidators(required, length({ max: 50, min: 3 }))(values.name);
                errors.vcType = composeValidators(required, length({ max: 100, min: 3 }))(values.vcType);
                errors.vcIssuer = composeValidators(required, length({ max: 2048, min: 3 }))(values.vcIssuer);

                setNextShouldBeDisabled(ifFieldsHave(errors));

                return errors;
            } }
        >
            <Field.Input
                ariaLabel="Connection name"
                name="name"
                label="Name"
                inputType="resource_name"
                required={ true }
                maxLength={ 50 }
                minLength={ 3 }
                width={ 15 }
                placeholder="OID4VP Test1"
            />
            <Field.Input
                ariaLabel="Credential type"
                name="vcType"
                label="Credential Type"
                inputType="text"
                required={ true }
                maxLength={ 100 }
                minLength={ 3 }
                width={ 15 }
                placeholder="EmployeeBadge"
            />
            <Field.Input
                ariaLabel="Trusted issuer"
                name="vcIssuer"
                label="Trusted Issuer"
                inputType="text"
                required={ true }
                maxLength={ 2048 }
                minLength={ 3 }
                width={ 15 }
                placeholder="did:web:masked-unprofitably-ardith.ngrok-free.dev"
            />
        </WizardPage>
    );

    const renderHelpPanel = (): ReactElement => {
        return (
            <ModalWithSidePanel.SidePanel>
                <ModalWithSidePanel.Header className="wizard-header help-panel-header muted">
                    <div className="help-panel-header-text">
                        Help
                    </div>
                </ModalWithSidePanel.Header>
                <ModalWithSidePanel.Content>
                    <CreateConnectionWizardHelp
                        wizardHelp={ {
                            fields: [
                                {
                                    fieldName: "Name",
                                    hint: "Provide a unique name for the connection."
                                },
                                {
                                    fieldName: "Credential Type",
                                    hint: "Provide the verifiable credential type (for example EmployeeBadge)."
                                },
                                {
                                    fieldName: "Trusted Issuer",
                                    hint: "Provide the trusted issuer DID or URL used in presentation definition creation."
                                }
                            ],
                            message: {
                                header: "Prerequisites",
                                paragraphs: [
                                    "When you click <strong>Create</strong>, the console first creates a Presentation Definition and then creates the connection using the generated definition ID.",
                                    "Ensure the issuer is reachable and trusted for your credential verification flow."
                                ]
                            }
                        } }
                    />
                </ModalWithSidePanel.Content>
            </ModalWithSidePanel.SidePanel>
        );
    };

    return (
        <ModalWithSidePanel
            open={ true }
            className="wizard identity-provider-create-wizard"
            dimmer="blurring"
            onClose={ onWizardClose }
            closeOnDimmerClick={ false }
            closeOnEscape
            data-componentid={ `${ componentId }-modal` }
        >
            <ModalWithSidePanel.MainPanel>
                <ModalWithSidePanel.Header
                    className="wizard-header"
                    data-componentid={ `${ componentId }-modal-header` }
                >
                    <div className="display-flex">
                        <GenericIcon
                            icon={ resolveConnectionIcon() }
                            size="mini"
                            transparent
                            spaced="right"
                            data-componentid={ `${ componentId }-image` }
                        />
                        <div className="ml-1">
                            { title }
                            { subTitle && (
                                <Heading as="h6">
                                    { subTitle }
                                    <DocumentationLink link={ template?.docLink }>
                                        { t("common:learnMore") }
                                    </DocumentationLink>
                                </Heading>
                            ) }
                        </div>
                    </div>
                </ModalWithSidePanel.Header>
                <ModalWithSidePanel.Content className="content-container">
                    { alert && alertComponent }
                    <Wizard2
                        ref={ wizardRef }
                        initialValues={ initialValues }
                        onSubmit={ handleFormSubmit }
                        uncontrolledForm={ true }
                    >
                        { singlePage() }
                    </Wizard2>
                </ModalWithSidePanel.Content>
                <ModalWithSidePanel.Actions>
                    <SemanticGrid>
                        <SemanticGrid.Row column={ 1 }>
                            <SemanticGrid.Column mobile={ 8 } tablet={ 8 } computer={ 8 }>
                                <LinkButton floated="left" onClick={ onWizardClose }>
                                    { t("common:cancel") }
                                </LinkButton>
                            </SemanticGrid.Column>
                            <SemanticGrid.Column mobile={ 8 } tablet={ 8 } computer={ 8 }>
                                <PrimaryButton
                                    loading={ isSubmitting }
                                    disabled={ nextShouldBeDisabled || isSubmitting }
                                    floated="right"
                                    onClick={ () => wizardRef?.current?.gotoNextPage() }
                                >
                                    { t("common:create") }
                                </PrimaryButton>
                            </SemanticGrid.Column>
                        </SemanticGrid.Row>
                    </SemanticGrid>
                </ModalWithSidePanel.Actions>
            </ModalWithSidePanel.MainPanel>
            { renderHelpPanel() }
        </ModalWithSidePanel>
    );
};

const ifFieldsHave = (errors: Record<string, string>): boolean => {
    return !Object.keys(errors).every((key: string) => !errors[ key ]);
};

const required = (value: string): string => {
    if (!value) {
        return "This is a required field";
    }

    return undefined;
};

const length = (minMax: { min: number; max: number }) => (value: string): string => {
    if (!value && minMax.min > 0) {
        return "You cannot leave this blank";
    }

    if (value?.length > minMax.max) {
        return `Cannot exceed more than ${ minMax.max } characters.`;
    }

    if (value?.length < minMax.min) {
        return `Should have at least ${ minMax.min } characters.`;
    }

    return undefined;
};
