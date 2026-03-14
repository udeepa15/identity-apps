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

import { AlertLevels, TestableComponentInterface } from "@wso2is/core/models";
import { addAlert } from "@wso2is/core/store";
import { AxiosError, AxiosResponse } from "axios";
import isEmpty from "lodash-es/isEmpty";
import React, { FunctionComponent, ReactElement, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { Dispatch } from "redux";
import { getFederatedAuthenticatorDetails } from "../../../api/authenticators";
import { getPresentationDefinitionClaims } from "../../../api/connections";
import { ConnectionInterface, CommonPluggableComponentPropertyInterface } from "../../../models/connection";
import { AttributeSettings } from "./attribute-settings";

interface PresentationDefinitionClaimInterface {
    name?: string;
    path?: string;
}

interface PresentationDefinitionDescriptorClaimsInterface {
    claims?: PresentationDefinitionClaimInterface[];
    inputDescriptorId?: string;
}

interface DigitalCredentialsClaimMappingSettingsPropsInterface extends TestableComponentInterface {
    identityProvider: ConnectionInterface;
    isLoading?: boolean;
    isReadOnly: boolean;
    loader: () => ReactElement;
    onUpdate: (id: string) => void;
}

/**
 * Claim mapping settings for Digital Credentials connection.
 *
 * @param props - Component props.
 * @returns React element.
 */
export const DigitalCredentialsClaimMappingSettings: FunctionComponent<
    DigitalCredentialsClaimMappingSettingsPropsInterface
> = (
    props: DigitalCredentialsClaimMappingSettingsPropsInterface
): ReactElement => {

    const {
        identityProvider,
        isLoading,
        isReadOnly,
        loader,
        onUpdate,
        [ "data-testid" ]: testId = "digital-credentials-claim-mapping-settings"
    } = props;

    const dispatch: Dispatch = useDispatch();
    const { t } = useTranslation();

    const [ presentationDefinitionId, setPresentationDefinitionId ] = useState<string>(undefined);
    const [ allowedMappedValues, setAllowedMappedValues ] = useState<string[]>([]);
    const [ isClaimsLoading, setIsClaimsLoading ] = useState<boolean>(false);

    const resolvePresentationDefinitionIdFromIdentityProvider = (): string => {
        const defaultAuthenticatorId: string = identityProvider?.federatedAuthenticators?.defaultAuthenticatorId;
        const authenticators = identityProvider?.federatedAuthenticators?.authenticators ?? [];

        const selectedAuthenticator = authenticators.find((authenticator: any) => {
            return authenticator?.authenticatorId === defaultAuthenticatorId;
        }) ?? authenticators[ 0 ];

        const authenticatorProperties: CommonPluggableComponentPropertyInterface[] =
            selectedAuthenticator?.properties ?? [];

        const pdProperty: CommonPluggableComponentPropertyInterface = authenticatorProperties.find(
            (property: CommonPluggableComponentPropertyInterface) => property.key === "presentationDefinitionId"
        );

        return pdProperty?.value;
    };

    const resolvePresentationDefinitionId = async (): Promise<void> => {
        const idFromIdentityProvider: string = resolvePresentationDefinitionIdFromIdentityProvider();

        if (!isEmpty(idFromIdentityProvider)) {
            setPresentationDefinitionId(idFromIdentityProvider);

            return;
        }

        const idpId: string = identityProvider?.id;
        const defaultAuthenticatorId: string = identityProvider?.federatedAuthenticators?.defaultAuthenticatorId;

        if (isEmpty(idpId) || isEmpty(defaultAuthenticatorId)) {
            setPresentationDefinitionId(undefined);

            return;
        }

        try {
            const authenticatorDetails: any = await getFederatedAuthenticatorDetails(idpId, defaultAuthenticatorId);
            const authenticatorProperties: CommonPluggableComponentPropertyInterface[] =
                authenticatorDetails?.properties ?? [];

            const pdProperty: CommonPluggableComponentPropertyInterface = authenticatorProperties.find(
                (property: CommonPluggableComponentPropertyInterface) => property.key === "presentationDefinitionId"
            );

            setPresentationDefinitionId(pdProperty?.value);
        } catch (_error) {
            setPresentationDefinitionId(undefined);
        }
    };

    const extractAllowedMappedValues = (
        response: AxiosResponse<any>
    ): string[] => {
        const data: unknown = response?.data;

        if (!Array.isArray(data)) {
            return [];
        }

        const claimNames: string[] = (data as PresentationDefinitionDescriptorClaimsInterface[])
            .flatMap((descriptor: PresentationDefinitionDescriptorClaimsInterface) => {
                if (!Array.isArray(descriptor?.claims)) {
                    return [];
                }

                return descriptor.claims
                    .map((claim: PresentationDefinitionClaimInterface) => claim?.name?.trim())
                    .filter((claimName: string) => !isEmpty(claimName));
            });

        return [ ...new Set(claimNames) ];
    };

    const fetchPresentationDefinitionClaims = async (): Promise<void> => {
        if (isEmpty(presentationDefinitionId)) {
            setAllowedMappedValues([]);

            return;
        }

        setIsClaimsLoading(true);

        try {
            const response: AxiosResponse<any> = await getPresentationDefinitionClaims(presentationDefinitionId);
            const extractedClaims: string[] = extractAllowedMappedValues(response);

            setAllowedMappedValues(extractedClaims);
        } catch (error) {
            setAllowedMappedValues([]);

            const axiosError: AxiosError = error as AxiosError;

            dispatch(addAlert({
                description: axiosError?.response?.data?.description
                    ? axiosError.response.data.description
                    : t("authenticationProvider:notifications.addIDP.genericError.description"),
                level: AlertLevels.ERROR,
                message: "Failed to fetch presentation definition claims"
            }));
        } finally {
            setIsClaimsLoading(false);
        }
    };

    useEffect(() => {
        resolvePresentationDefinitionId();
    }, [ identityProvider?.id, identityProvider?.federatedAuthenticators?.defaultAuthenticatorId ]);

    useEffect(() => {
        fetchPresentationDefinitionClaims();
    }, [ presentationDefinitionId ]);

    if (isClaimsLoading) {
        return loader();
    }

    return (
        <AttributeSettings
            idpId={ identityProvider?.id }
            initialClaims={ identityProvider?.claims }
            initialRoleMappings={ identityProvider?.roles?.mappings }
            isLoading={ isLoading }
            onUpdate={ onUpdate }
            hideIdentityClaimAttributes={ false }
            isRoleMappingsEnabled={ true }
            data-testid={ `${ testId }-attribute-settings` }
            provisioningAttributesEnabled={ false }
            isReadOnly={ isReadOnly }
            loader={ loader }
            isOIDC={ false }
            isSaml={ false }
            allowedMappedValues={ allowedMappedValues }
        />
    );
};

export default DigitalCredentialsClaimMappingSettings;
