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

/*
import Autocomplete, {
    AutocompleteRenderGetTagProps,
    AutocompleteRenderInputParams
} from "@oxygen-ui/react/Autocomplete";
import Chip from "@oxygen-ui/react/Chip";
import TextField from "@oxygen-ui/react/TextField";
*/
import { getAllExternalClaims, getAllLocalClaims } from "@wso2is/admin.claims.v1/api";
import { AlertInterface, AlertLevels, Claim, ExternalClaim, IdentifiableComponentInterface } from "@wso2is/core/models";
import { addAlert } from "@wso2is/core/store";
import { Hint, Heading } from "@wso2is/react-components";
import React, { FunctionComponent, HTMLAttributes, ReactElement, SyntheticEvent, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";

/**
 * Prop types for the Verification Settings step.
 */
interface VerificationSettingsStepProps extends IdentifiableComponentInterface {
    triggerSubmit: boolean;
    initialValues: any;
    onSubmit: (values: any) => void;
}

/**
 * Verification Settings step component.
 *
 * @param props - Props injected to the component.
 * @returns React element.
 */
export const VerificationSettingsStep: FunctionComponent<VerificationSettingsStepProps> = (
    props: VerificationSettingsStepProps
): ReactElement => {

    const {
        triggerSubmit,
        onSubmit,
        [ "data-componentid" ]: componentId = "verification-settings-step"
    } = props;

    const { t } = useTranslation();
    const dispatch: any = useDispatch();

    console.log("VerificationSettingsStep: Rendering", { props });

    const [ localClaims, setLocalClaims ] = useState<Claim[]>([]);
    const [ externalClaims, setExternalClaims ] = useState<ExternalClaim[]>([]);
    const [ claimAttributes, setClaimAttributes ] = useState<ExternalClaim[]>([]);
    const [ selectedClaims, setSelectedClaims ] = useState<ExternalClaim[]>([]);
    const [ isClaimsLoading, setIsClaimsLoading ] = useState<boolean>(true);

    // Hardcoded VC Claim Dialect ID as per existing implementation
    const VC_CLAIM_DIALECT_ID: string = "aHR0cDovL3dzbzIub3JnL2NsYWltcy92Yw";

    /**
     * Fetch local and external claims on component mount.
     */
    useEffect(() => {
        fetchLocalClaims();
        fetchExternalClaims();
    }, []);

    /**
     * Map external claims with local claim display names.
     */
    useEffect(() => {
        if (localClaims?.length > 0 && externalClaims?.length > 0) {
            const updatedAttributes: ExternalClaim[] = externalClaims.map((externalClaim: ExternalClaim) => {
                const matchedLocalClaim: Claim = localClaims.find((localClaim: Claim) =>
                    localClaim.claimURI === externalClaim.mappedLocalClaimURI
                );

                if (matchedLocalClaim?.displayName) {
                    return {
                        ...externalClaim,
                        localClaimDisplayName: matchedLocalClaim.displayName
                    };
                }

                return externalClaim;
            });

            setClaimAttributes(updatedAttributes);
        }
    }, [ localClaims, externalClaims ]);

    /**
     * Fetch local claims.
     */
    const fetchLocalClaims = (): void => {
        getAllLocalClaims(null)
            .then((response: Claim[]) => {
                setLocalClaims(response);
            })
            .catch(() => {
                dispatch(addAlert<AlertInterface>({
                    description: "Error retrieving local claims.",
                    level: AlertLevels.ERROR,
                    message: "Retrieval Error"
                }));
            });
    };

    /**
     * Fetch external claims from VC dialect.
     */
    const fetchExternalClaims = (): void => {
        setIsClaimsLoading(true);

        getAllExternalClaims(VC_CLAIM_DIALECT_ID, null)
            .then((response: ExternalClaim[]) => {
                setExternalClaims(response);
            })
            .catch(() => {
                dispatch(addAlert<AlertInterface>({
                    description: "Error retrieving external claims.",
                    level: AlertLevels.ERROR,
                    message: "Retrieval Error"
                }));
            })
            .finally(() => {
                setIsClaimsLoading(false);
            });
    };

    /**
     * Handles the form submission when the wizard triggers it.
     */
    useEffect(() => {
        if (triggerSubmit) {
            // Generate Presentation Definition JSON
            const presentationDefinition = {
                "id": "Standard-Presentation-Definition",
                "input_descriptors": [
                    {
                        "id": "Standard-Presentation-Definition-Input-Descriptor",
                        "name": "Required Claims",
                        "purpose": "To verify the identity of the user",
                        "constraints": {
                            "fields": selectedClaims.map(claim => ({
                                "path": [ `$.credentialSubject.${claim.claimURI.split('/').pop()}` ],
                                "filter": {
                                    "type": "string"
                                }
                            }))
                        }
                    }
                ]
            };
            
            // Pass the data back to the parent wizard
            onSubmit({
                presentationDefinition: JSON.stringify(presentationDefinition) 
            });
        }
    }, [ triggerSubmit ]);

    return (
        <div data-testid={ componentId } data-componentid={ componentId }>
            <Heading as="h4">Requested Claims</Heading>
            <Hint>
                Select the claims that are required from the Digital Credential.
            </Hint>
            
            <div>
               Placeholder for Autocomplete (Commented out for debugging)
            </div>
        </div>
    );
};
