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

import { IdentifiableComponentInterface } from "@wso2is/core/models";
import { Field, Form } from "@wso2is/form";
import React, { FunctionComponent, ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { ConnectionTemplateInterface } from "../../../../models/connection";

/**
 * Prop types for the General Settings step.
 */
interface GeneralSettingsPropsInterface extends IdentifiableComponentInterface {
    triggerSubmit: boolean;
    initialValues: any;
    onSubmit: (values: any) => void;
    template?: ConnectionTemplateInterface;
}

/**
 * General Settings step component.
 *
 * @param props - Props injected to the component.
 * @returns React element.
 */
export const GeneralSettings: FunctionComponent<GeneralSettingsPropsInterface> = (
    props: GeneralSettingsPropsInterface
): ReactElement => {

    const {
        triggerSubmit,
        initialValues,
        onSubmit,
        template,
        [ "data-componentid" ]: componentId = "general-settings-step"
    } = props;

    const { t } = useTranslation();
    
    return (
        <Form
            id={ componentId }
            uncontrolledForm={ false }
            validate={ (values) => {
                const errors: any = {};
                if (!values.name) {
                    errors.name = t("authenticationProvider:forms.common.requiredErrorMessage");
                }
                return errors;
            } }
            initialValues={ initialValues }
            onSubmit={ onSubmit }
            triggerSubmit={ (submitFunction) => {
                if (triggerSubmit) {
                    submitFunction();
                }
            } }
        >
            <Field.Input
                ariaLabel="Connection Name"
                inputType="name"
                name="name"
                label={ t("authenticationProvider:forms.generalDetails.name.label") }
                placeholder={ t("authenticationProvider:forms.generalDetails.name.placeholder") }
                required={ true }
                maxLength={ 50 }
                minLength={ 3 }
                data-componentid={ `${componentId}-name` }
                width={ 16 }
            />
            <Field.Input
                ariaLabel="Connection Description"
                inputType="description"
                name="description"
                label={ t("authenticationProvider:forms.generalDetails.description.placeholder") }
                placeholder={ t("authenticationProvider:forms.generalDetails.description.placeholder") }
                type="text"
                maxLength={ 300 }
                minLength={ 3 }
                data-componentid={ `${componentId}-description` }
                width={ 16 }
            />
        </Form>
    );
};
