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
import { TestableComponentInterface } from "@wso2is/core/models";
import { Field, Form } from "@wso2is/form";
import isBoolean from "lodash-es/isBoolean";
import isEmpty from "lodash-es/isEmpty";
import React, { FunctionComponent, ReactElement, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    CommonAuthenticatorFormInitialValuesInterface,
    CommonAuthenticatorFormMetaInterface,
    CommonAuthenticatorFormPropertyInterface
} from "../../../../models/authenticators";
import {
    CommonPluggableComponentPropertyInterface
} from "../../../../models/connection";

/**
 * Interface for OpenID4VP Authenticator Form props.
 */
interface OpenID4VPAuthenticatorFormPropsInterface extends TestableComponentInterface {
    /**
     * Authenticator metadata.
     */
    metadata: CommonAuthenticatorFormMetaInterface;
    /**
     * Authenticator configured initial values.
     */
    initialValues: CommonAuthenticatorFormInitialValuesInterface;
    /**
     * Callback for form submit.
     * @param values - Resolved Form Values.
     */
    onSubmit: (values: CommonAuthenticatorFormInitialValuesInterface) => void;
    /**
     * Is readonly.
     */
    readOnly?: boolean;
    /**
     * Flag to trigger form submit externally.
     */
    triggerSubmit: boolean;
    /**
     * Flag to enable/disable form submit button.
     */
    enableSubmitButton: boolean;
    /**
     * Flag to show/hide custom properties.
     */
    showCustomProperties: boolean;
    /**
     * Specifies if the form is submitting.
     */
    isSubmitting?: boolean;
}

/**
 * Form initial values interface.
 */
interface OpenID4VPAuthenticatorFormInitialValuesInterface {
    PresentationDefinitionId: string;
    ResponseMode: string;
    TimeoutSeconds: string;
    ClientId: string;
    SubjectClaim: string;
}

const FORM_ID: string = "openid4vp-authenticator-form";

/**
 * OpenID4VP Authenticator Form.
 *
 * @param props - Props injected to the component.
 * @returns Functional component.
 */
export const OpenID4VPAuthenticatorForm: FunctionComponent<OpenID4VPAuthenticatorFormPropsInterface> = (
    props: OpenID4VPAuthenticatorFormPropsInterface
): ReactElement => {

    const {
        initialValues: originalInitialValues,
        onSubmit,
        readOnly,
        isSubmitting,
        ["data-testid"]: testId
    } = props;

    const { t } = useTranslation();

    const [initialValues, setInitialValues] = useState<OpenID4VPAuthenticatorFormInitialValuesInterface>(undefined);

    const {
        data: presentationDefinitions,
        isLoading: isPresentationDefinitionsLoading
    } = useGetPresentationDefinitions();

    /**
     * Flattens and resolved form initial values.
     */
    useEffect(() => {

        if (isEmpty(originalInitialValues?.properties)) {
            return;
        }

        let resolvedInitialValues: any = {};

        originalInitialValues.properties.forEach((value: CommonAuthenticatorFormPropertyInterface) => {
            const moderatedName: string = value.name.replace(/\./g, "_");

            resolvedInitialValues = {
                ...resolvedInitialValues,
                [moderatedName]: (value.value === "true" || value.value === "false")
                    ? JSON.parse(value.value)
                    : value.value
            };
        });

        setInitialValues(resolvedInitialValues as OpenID4VPAuthenticatorFormInitialValuesInterface);
    }, [originalInitialValues]);

    /**
     * Prepare form values for submitting.
     *
     * @param values - Form values.
     * @returns Sanitized form values.
     */
    const getUpdatedConfigurations = (values: OpenID4VPAuthenticatorFormInitialValuesInterface)
        : CommonAuthenticatorFormInitialValuesInterface => {

        const properties: CommonPluggableComponentPropertyInterface[] = [];

        for (const [name, value] of Object.entries(values)) {
            if (name !== undefined) {
                const moderatedName: string = name.replace(/_/g, ".");

                properties.push({
                    name: moderatedName,
                    value: isBoolean(value) ? value.toString() : value
                });
            }
        }

        return {
            ...originalInitialValues,
            properties
        };
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

    return (
        <Form
            id={FORM_ID}
            uncontrolledForm={false}
            onSubmit={(values: Record<string, any>) => {
                onSubmit(getUpdatedConfigurations(values as OpenID4VPAuthenticatorFormInitialValuesInterface));
            }}
            initialValues={initialValues}
        >
            <Field.Dropdown
                ariaLabel="Presentation Definition ID"
                name="PresentationDefinitionId"
                label="Presentation Definition"
                placeholder="Select a Presentation Definition"
                options={presentationDefinitionOptions}
                loading={isPresentationDefinitionsLoading}
                required={false}
                readOnly={readOnly}
                width={12}
                data-testid={`${testId}-presentation-definition-id`}
            />
            <Field.Input
                ariaLabel="Response Mode"
                name="ResponseMode"
                label="Response Mode"
                placeholder="Enter response mode (e.g., direct_post)"
                required={false}
                readOnly={readOnly}
                width={12}
                data-testid={`${testId}-response-mode`}
                inputType="text"
                maxLength={100}
                minLength={1}
            />
            <Field.Input
                ariaLabel="Timeout Seconds"
                inputType="number"
                name="TimeoutSeconds"
                label="Timeout (Seconds)"
                placeholder="Enter timeout in seconds"
                required={false}
                readOnly={readOnly}
                width={12}
                data-testid={`${testId}-timeout-seconds`}
                maxLength={5}
                minLength={1}
            />
            <Field.Input
                ariaLabel="Client ID"
                name="ClientId"
                label="Client ID (Optional)"
                placeholder="Enter custom Client ID"
                required={false}
                readOnly={readOnly}
                width={12}
                data-testid={`${testId}-client-id`}
                inputType="text"
                maxLength={100}
                minLength={1}
            />
            <Field.Input
                ariaLabel="Subject Claim"
                name="SubjectClaim"
                label="Subject Claim"
                placeholder="Enter subject claim (e.g., $.sub)"
                required={false}
                readOnly={readOnly}
                width={12}
                data-testid={`${testId}-subject-claim`}
                inputType="text"
                maxLength={100}
                minLength={1}
            />
            <Field.Button
                form={FORM_ID}
                size="small"
                buttonType="primary_btn"
                ariaLabel="OpenID4VP authenticator update button"
                name="update-button"
                data-testid={`${testId}-submit-button`}
                disabled={isSubmitting}
                loading={isSubmitting}
                label={t("common:update")}
                hidden={readOnly}
            />
        </Form>
    );
};

/**
 * Default props for the component.
 */
OpenID4VPAuthenticatorForm.defaultProps = {
    "data-testid": "openid4vp-authenticator-form",
    enableSubmitButton: true
};
