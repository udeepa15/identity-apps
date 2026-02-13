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

import { ExternalClaim, IdentifiableComponentInterface } from "@wso2is/core/models";
import { CopyInputField, Heading, Hint } from "@wso2is/react-components";
import React, { FunctionComponent, ReactElement, useEffect, useState } from "react";

/**
 * Prop types for the Summary step.
 */
interface SummaryStepProps extends IdentifiableComponentInterface {
    triggerSubmit: boolean;
    wizardState: any;
    onSubmit: (values: any) => void;
}

/**
 * Summary step component.
 *
 * @param props - Props injected to the component.
 * @returns React element.
 */
export const SummaryStep: FunctionComponent<SummaryStepProps> = (
    props: SummaryStepProps
): ReactElement => {

    const {
        triggerSubmit,
        wizardState,
        onSubmit,
        [ "data-componentid" ]: componentId = "summary-step"
    } = props;

    const [ presentationDefinition, setPresentationDefinition ] = useState<string>("");

    /**
     * Generate the Presentation Definition JSON on mount.
     */
    useEffect(() => {
        if (wizardState) {
            const { credentialName, selectedClaims } = wizardState;
            
            const pd = {
                "id": "Standard-Presentation-Definition",
                "input_descriptors": [
                    {
                        "id": "Standard-Presentation-Definition-Input-Descriptor",
                        "name": credentialName || "Required Claims",
                        "purpose": "To verify the identity of the user",
                        "constraints": {
                            "fields": selectedClaims?.map((claim: ExternalClaim) => ({
                                "path": [ `$.credentialSubject.${claim.claimURI.split('/').pop()}` ],
                                "filter": {
                                    "type": "string"
                                }
                            })) || []
                        }
                    }
                ]
            };

            setPresentationDefinition(JSON.stringify(pd, null, 4));
        }
    }, [ wizardState ]);

    /**
     * Handles the form submission when the wizard triggers it.
     */
    useEffect(() => {
        if (triggerSubmit) {
            onSubmit({
                presentationDefinition
            });
        }
    }, [ triggerSubmit ]);

    return (
        <div data-testid={ componentId } data-componentid={ componentId }>
            <Heading as="h4">Summary</Heading>
            <Hint>
                Review the generated Presentation Definition JSON before finishing.
            </Hint>
            
            <div className="code-editor-wrapper" style={{ marginTop: "20px" }}>
                 <CopyInputField
                    value={ presentationDefinition }
                    className="copy-input-field"
                />
                
                <div style={{ 
                    marginTop: "20px",
                    padding: "10px",
                    backgroundColor: "#f5f5f5",
                    borderRadius: "5px",
                    border: "1px solid #ddd",
                    fontFamily: "monospace",
                    whiteSpace: "pre-wrap",
                    maxHeight: "300px",
                    overflowY: "auto"
                }}>
                    { presentationDefinition }
                </div>
            </div>
        </div>
    );
};
