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
import { ContentLoader, LinkButton, PrimaryButton } from "@wso2is/react-components";
import { AxiosError, AxiosResponse } from "axios";
import isEmpty from "lodash-es/isEmpty";
import React, { FunctionComponent, ReactElement, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { Dispatch } from "redux";
import { Divider, Form, Icon, Input, Label } from "semantic-ui-react";
import { getPresentationDefinitionClaims } from "../../../api/connections";
import { ConnectionInterface, CommonPluggableComponentPropertyInterface } from "../../../models/connection";

interface DigitalCredentialsPresentationDefinitionClaimsPropsInterface extends TestableComponentInterface {
    identityProvider: ConnectionInterface;
    isReadOnly: boolean;
}

export const DigitalCredentialsPresentationDefinitionClaims: FunctionComponent<
    DigitalCredentialsPresentationDefinitionClaimsPropsInterface
> = (
    props: DigitalCredentialsPresentationDefinitionClaimsPropsInterface
): ReactElement => {

    const {
        identityProvider,
        isReadOnly,
        [ "data-testid" ]: testId = "digital-credentials-pd-claims"
    } = props;

    const { t } = useTranslation();
    const dispatch: Dispatch = useDispatch();

    const [ claims, setClaims ] = useState<string[]>([]);
    const [ draftClaim, setDraftClaim ] = useState<string>("");
    const [ isLoading, setIsLoading ] = useState<boolean>(false);

    const presentationDefinitionId: string = useMemo(() => {
        const authenticatorProperties: CommonPluggableComponentPropertyInterface[] =
            identityProvider?.federatedAuthenticators?.authenticators?.[ 0 ]?.properties ?? [];

        const pdProperty: CommonPluggableComponentPropertyInterface = authenticatorProperties.find(
            (property: CommonPluggableComponentPropertyInterface) => property.key === "presentationDefinitionId"
        );

        return pdProperty?.value;
    }, [ identityProvider ]);

    const fetchPresentationDefinitionClaims = async (): Promise<void> => {
        if (isEmpty(presentationDefinitionId)) {
            setClaims([]);

            return;
        }

        setIsLoading(true);

        try {
            const response: AxiosResponse<string[]> = await getPresentationDefinitionClaims(presentationDefinitionId);

            setClaims(response?.data ?? []);
        } catch (error) {
            const axiosError: AxiosError = error as AxiosError;

            dispatch(addAlert({
                description: axiosError?.response?.data?.description
                    ? axiosError.response.data.description
                    : t("authenticationProvider:notifications.addIDP.genericError.description"),
                level: AlertLevels.ERROR,
                message: "Failed to fetch presentation definition claims"
            }));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPresentationDefinitionClaims();
    }, [ presentationDefinitionId ]);

    const onAddClaim = (): void => {
        const nextClaim: string = draftClaim?.trim();

        if (isEmpty(nextClaim) || claims.includes(nextClaim)) {
            return;
        }

        setClaims([ ...claims, nextClaim ]);
        setDraftClaim("");
    };

    const onRemoveClaim = (claim: string): void => {
        setClaims(claims.filter((item: string) => item !== claim));
    };

    const onSaveChanges = (): void => {
        dispatch(addAlert({
            description: "Claim editing UI is available. Claim update API integration can be wired to persist changes.",
            level: AlertLevels.INFO,
            message: "Presentation definition claims updated in UI"
        }));
    };

    if (isLoading) {
        return <ContentLoader active inline="centered" />;
    }

    return (
        <div data-testid={ testId }>
            <p>
                Presentation Definition ID: <strong>{ presentationDefinitionId || "Not available" }</strong>
            </p>
            <Divider hidden />

            <Form>
                <Form.Field>
                    <label>Claims</label>
                    {
                        claims?.length > 0
                            ? claims.map((claim: string) => (
                                <Label key={ claim } size="large" style={ { marginBottom: "0.5rem" } }>
                                    { claim }
                                    {
                                        !isReadOnly && (
                                            <Icon name="delete" onClick={ () => onRemoveClaim(claim) }/>
                                        )
                                    }
                                </Label>
                            ))
                            : <p>No claims found in the selected presentation definition.</p>
                    }
                </Form.Field>

                {
                    !isReadOnly && (
                        <>
                            <Form.Field>
                                <label>Add claim</label>
                                <Input
                                    value={ draftClaim }
                                    placeholder="email"
                                    onChange={ (_event: React.ChangeEvent<HTMLInputElement>, data: { value: string }) => {
                                        setDraftClaim(data.value);
                                    } }
                                    action={ {
                                        content: "Add",
                                        onClick: onAddClaim,
                                        type: "button"
                                    } }
                                />
                            </Form.Field>
                            <PrimaryButton type="button" onClick={ onSaveChanges }>
                                Save claims
                            </PrimaryButton>
                        </>
                    )
                }

                <LinkButton type="button" onClick={ fetchPresentationDefinitionClaims }>
                    Refresh claims
                </LinkButton>
            </Form>
        </div>
    );
};

export default DigitalCredentialsPresentationDefinitionClaims;
