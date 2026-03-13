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
    Steps,
    useWizardAlert
} from "@wso2is/react-components";
import { AxiosError, AxiosResponse } from "axios";
import cloneDeep from "lodash-es/cloneDeep";
import get from "lodash-es/get";
import isEmpty from "lodash-es/isEmpty";
import React, { FunctionComponent, MutableRefObject, ReactElement, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { Dispatch } from "redux";
import { Icon, Grid as SemanticGrid } from "semantic-ui-react";
import {
    createConnection,
    createPresentationDefinition,
    CreatePresentationDefinitionRequestInterface,
    CreatePresentationDefinitionResponseInterface,
    getPresentationDefinitionClaims,
    PresentationDefinitionCredentialInterface
} from "../../api/connections";
import {
    ConnectionClaimMappingInterface,
    ConnectionInterface,
    GenericConnectionCreateWizardPropsInterface
} from "../../models/connection";
import { ConnectionsManagementUtils } from "../../utils/connection-utils";

interface DigitalCredentialsConnectionCreateWizardPropsInterface extends
    GenericConnectionCreateWizardPropsInterface, IdentifiableComponentInterface {
}

enum WizardSteps {
    CONNECTION_DETAILS = "ConnectionDetails",
    PRESENTATION_DEFINITION = "PresentationDefinition"
}

interface WizardStepInterface {
    icon: string;
    name: WizardSteps;
    title: string;
}

interface DigitalCredentialWizardFormValuesInterface {
    credentials: string;
    description?: string;
    name: string;
    pdDescription?: string;
    pdName: string;
    responseMode: string;
    subjectClaim?: string;
    timeout: string;
}

interface WizardRefInterface {
    previousPage: () => void;
    submitForm: () => void;
}

const DEFAULT_RESPONSE_MODE: string = "direct_post";
const DEFAULT_SUBJECT_CLAIM: string = "email";
const DEFAULT_TIMEOUT: string = "300";
const EMAIL_LOCAL_CLAIM_URI: string = "http://wso2.org/claims/emailaddress";

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

    const [ currentWizardStep, setCurrentWizardStep ] = useState<number>(0);
    const [ nextShouldBeDisabled, setNextShouldBeDisabled ] = useState<boolean>(false);
    const [ isSubmitting, setIsSubmitting ] = useState<boolean>(false);
    const [ alert, setAlert, alertComponent ] = useWizardAlert();

    const wizardRef: MutableRefObject<WizardRefInterface> = useRef<WizardRefInterface>(null);
    const eventPublisher: EventPublisher = EventPublisher.getInstance();

    const wizardSteps: WizardStepInterface[] = useMemo(() => ([
        {
            icon: "setting",
            name: WizardSteps.CONNECTION_DETAILS,
            title: "Connection Details"
        },
        {
            icon: "id badge",
            name: WizardSteps.PRESENTATION_DEFINITION,
            title: "Presentation Definition"
        }
    ]), []);

    const initialValues: DigitalCredentialWizardFormValuesInterface = {
        credentials: "[{\"type\":\"EmployeeBadge1\",\"purpose\":\"Please share your employee badge to prove employment.\",\"issuer\":\"did:web:masked-unprofitably-ardith.ngrok-free.dev\",\"claims\":[\"email\",\"first_name\"]},{\"type\":\"EmployeeBadge2\",\"purpose\":\"Please share your employee badge to prove employment.\",\"issuer\":\"did:web:masked-unprofitably-ardith.ngrok-free.dev\",\"claims\":[\"firstName\"]}]",
        description: "Minimal OpenID4VP connection - extracts all VC claims (no filtering)",
        name: "Digital Credentials",
        pdDescription: "Verifies employee credentials",
        pdName: "Employee Credential Verification (email,firstName)",
        responseMode: DEFAULT_RESPONSE_MODE,
        subjectClaim: DEFAULT_SUBJECT_CLAIM,
        timeout: DEFAULT_TIMEOUT
    };

    const resolveConnectionIcon = (): string => {
        return ConnectionsManagementUtils.resolveConnectionResourcePath("", template?.image);
    };

    const parseCredentials = (credentialsValue: string): PresentationDefinitionCredentialInterface[] => {
        const parsedCredentials: unknown = JSON.parse(credentialsValue);

        if (!Array.isArray(parsedCredentials)) {
            throw new Error("Credentials should be a JSON array.");
        }

        return parsedCredentials as PresentationDefinitionCredentialInterface[];
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

    const buildClaimMappings = (claims: string[], subjectClaim: string): ConnectionClaimMappingInterface[] => {
        const resolvedClaim: string = !isEmpty(subjectClaim)
            ? subjectClaim
            : (claims?.length > 0 ? claims[ 0 ] : DEFAULT_SUBJECT_CLAIM);

        return [
            {
                idpClaim: resolvedClaim,
                localClaim: {
                    uri: EMAIL_LOCAL_CLAIM_URI
                }
            }
        ];
    };

    const createConnectionFromValues = async (values: DigitalCredentialWizardFormValuesInterface): Promise<void> => {
        const credentials: PresentationDefinitionCredentialInterface[] = parseCredentials(values.credentials);
        const inputClaims: string[] = credentials
            .flatMap((credential: PresentationDefinitionCredentialInterface) => credential?.claims ?? []);

        const pdRequest: CreatePresentationDefinitionRequestInterface = {
            credentials,
            description: values.pdDescription,
            name: values.pdName
        };

        const createPDResponse: AxiosResponse<CreatePresentationDefinitionResponseInterface> =
            await createPresentationDefinition(pdRequest);
        const presentationDefinitionId: string = extractPresentationDefinitionId(createPDResponse);

        let mappedClaims: string[] = inputClaims;

        try {
            const claimsResponse: AxiosResponse<string[]> = await getPresentationDefinitionClaims(presentationDefinitionId);

            if (claimsResponse?.data?.length > 0) {
                mappedClaims = claimsResponse.data;
            }
        } catch (error) {
            // Ignore claims fetch errors and continue with the claims provided by the user.
        }

        const connection: ConnectionInterface = cloneDeep(template.idp);

        connection.name = values.name;
        connection.description = values.description;
        connection.templateId = template.templateId;

        connection.federatedAuthenticators.authenticators[ 0 ].properties = [
            {
                key: "presentationDefinitionId",
                value: presentationDefinitionId
            },
            {
                key: "responseMode",
                value: values.responseMode
            },
            {
                key: "timeout",
                value: values.timeout
            },
            {
                key: "subjectClaim",
                value: values.subjectClaim
            }
        ];

        connection.claims = {
            mappings: buildClaimMappings(mappedClaims, values.subjectClaim),
            provisioningClaims: [],
            userIdClaim: {
                uri: EMAIL_LOCAL_CLAIM_URI
            }
        };

        if (!isEmpty(UIConfig?.connectionResourcesUrl)) {
            connection.image = UIConfig.connectionResourcesUrl + template.image;
        } else {
            connection.image = resolveConnectionIcon();
        }

        const response: AxiosResponse<ConnectionInterface> = await createConnection(connection);

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

    const connectionDetailsPage = (): ReactElement => (
        <WizardPage
            validate={ (values: DigitalCredentialWizardFormValuesInterface) => {
                const errors: Record<string, string> = {};

                errors.name = composeValidators(required, length({ max: 50, min: 3 }))(values.name);
                setNextShouldBeDisabled(ifFieldsHave(errors));

                return errors;
            } }
        >
            <Field.Input
                ariaLabel="Connection name"
                name="name"
                label="Connection Name"
                inputType="resource_name"
                required={ true }
                maxLength={ 50 }
                minLength={ 3 }
                width={ 15 }
                placeholder="OID4VP Test1"
            />
            <Field.Input
                ariaLabel="Connection description"
                name="description"
                label="Description"
                inputType="textarea"
                required={ false }
                maxLength={ 300 }
                minLength={ 0 }
                width={ 15 }
                placeholder="Minimal OpenID4VP connection - extracts all VC claims (no filtering)"
            />
        </WizardPage>
    );

    const presentationDefinitionPage = (): ReactElement => (
        <WizardPage
            validate={ (values: DigitalCredentialWizardFormValuesInterface) => {
                const errors: Record<string, string> = {};

                errors.pdName = composeValidators(required, length({ max: 100, min: 3 }))(values.pdName);
                errors.credentials = composeValidators(required, validCredentialsJSON)(values.credentials);
                errors.responseMode = composeValidators(required)(values.responseMode);
                errors.timeout = composeValidators(required)(values.timeout);

                setNextShouldBeDisabled(ifFieldsHave(errors));

                return errors;
            } }
        >
            <Field.Input
                ariaLabel="Presentation definition name"
                name="pdName"
                label="Presentation Definition Name"
                inputType="text"
                required={ true }
                maxLength={ 100 }
                minLength={ 3 }
                width={ 15 }
                placeholder="Employee Credential Verification (email,firstName)"
            />
            <Field.Input
                ariaLabel="Presentation definition description"
                name="pdDescription"
                label="Presentation Definition Description"
                inputType="textarea"
                required={ false }
                maxLength={ 300 }
                minLength={ 0 }
                width={ 15 }
                placeholder="Verifies employee credentials"
            />
            <Field.Input
                ariaLabel="Credentials"
                name="credentials"
                label="Credentials"
                inputType="textarea"
                required={ true }
                maxLength={ 4000 }
                minLength={ 1 }
                width={ 15 }
                placeholder="Paste credentials as a JSON array."
            />
            <Field.Input
                ariaLabel="Response mode"
                name="responseMode"
                label="Response Mode"
                inputType="text"
                required={ true }
                maxLength={ 50 }
                minLength={ 3 }
                width={ 15 }
                placeholder="direct_post"
            />
            <Field.Input
                ariaLabel="Timeout"
                name="timeout"
                label="Timeout (seconds)"
                inputType="number"
                required={ true }
                maxLength={ 10 }
                minLength={ 1 }
                width={ 15 }
                placeholder="300"
            />
            <Field.Input
                ariaLabel="Subject claim"
                name="subjectClaim"
                label="Subject Claim"
                inputType="text"
                required={ false }
                maxLength={ 100 }
                minLength={ 0 }
                width={ 15 }
                placeholder="email"
            />
        </WizardPage>
    );

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
                <ModalWithSidePanel.Content className="steps-container">
                    <Steps.Group current={ currentWizardStep }>
                        { wizardSteps.map((step: WizardStepInterface, index: number) => (
                            <Steps.Step
                                key={ index }
                                icon={ step.icon }
                                title={ step.title }
                            />
                        )) }
                    </Steps.Group>
                </ModalWithSidePanel.Content>
                <ModalWithSidePanel.Content className="content-container">
                    { alert && alertComponent }
                    <Wizard2
                        ref={ wizardRef }
                        initialValues={ initialValues }
                        onSubmit={ handleFormSubmit }
                        uncontrolledForm={ true }
                        pageChanged={ (index: number) => setCurrentWizardStep(index) }
                    >
                        { connectionDetailsPage() }
                        { presentationDefinitionPage() }
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
                                { currentWizardStep < wizardSteps.length - 1 && (
                                    <PrimaryButton
                                        disabled={ nextShouldBeDisabled || isSubmitting }
                                        floated="right"
                                        onClick={ () => wizardRef?.current?.submitForm() }
                                    >
                                        { t("authenticationProvider:wizards.buttons.next") }
                                        <Icon name="arrow right"/>
                                    </PrimaryButton>
                                ) }
                                { currentWizardStep === wizardSteps.length - 1 && (
                                    <PrimaryButton
                                        loading={ isSubmitting }
                                        disabled={ nextShouldBeDisabled || isSubmitting }
                                        floated="right"
                                        onClick={ () => wizardRef?.current?.submitForm() }
                                    >
                                        { t("authenticationProvider:wizards.buttons.finish") }
                                    </PrimaryButton>
                                ) }
                                { currentWizardStep > 0 && (
                                    <LinkButton floated="right" onClick={ () => wizardRef?.current?.previousPage() }>
                                        { t("authenticationProvider:wizards.buttons.previous") }
                                    </LinkButton>
                                ) }
                            </SemanticGrid.Column>
                        </SemanticGrid.Row>
                    </SemanticGrid>
                </ModalWithSidePanel.Actions>
            </ModalWithSidePanel.MainPanel>
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

const validCredentialsJSON = (value: string): string => {
    try {
        const parsedValue: unknown = JSON.parse(value);

        if (!Array.isArray(parsedValue)) {
            return "Credentials should be a JSON array.";
        }

        return undefined;
    } catch (error) {
        return "Credentials should be a valid JSON array.";
    }
};
