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

import { IdentifiableComponentInterface } from "@wso2is/core/models";
import { CodeEditor, Hint } from "@wso2is/react-components";
import React, { FunctionComponent, ReactElement, useCallback, useState } from "react";
import { Button, Grid, Icon, Label, Message as SemanticMessage, Segment } from "semantic-ui-react";
import { PresentationDefinitionFormData, ValidationError } from "../../../models/presentation-definition-form";

/**
 * Props for PreviewStep component.
 */
interface PreviewStepProps extends IdentifiableComponentInterface {
    /** Current form data */
    formData: PresentationDefinitionFormData;
    /** Generated JSON string */
    generatedJson: string;
    /** Validation errors */
    errors: ValidationError[];
}

/**
 * Step 5: Preview & Validation.
 * Shows generated JSON and validation status.
 */
const PreviewStep: FunctionComponent<PreviewStepProps> = ({
    formData,
    generatedJson,
    errors,
    "data-componentid": componentId = "preview-step"
}: PreviewStepProps): ReactElement => {

    const [copied, setCopied] = useState(false);

    /**
     * Copies JSON to clipboard.
     */
    const handleCopy = useCallback(() => {
        navigator.clipboard.writeText(generatedJson).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    }, [generatedJson]);

    // Count errors and warnings
    const errorCount = errors.filter(e => e.severity === "error").length;
    const warningCount = errors.filter(e => e.severity === "warning").length;

    return (
        <div data-componentid={componentId}>
            {/* Validation Summary */}
            <Segment>
                <Grid>
                    <Grid.Row columns={3}>
                        <Grid.Column>
                            <Label
                                color={errorCount === 0 ? "green" : "red"}
                                size="large"
                            >
                                <Icon name={errorCount === 0 ? "check" : "times"} />
                                {errorCount === 0 ? "Valid" : `${errorCount} Error(s)`}
                            </Label>
                        </Grid.Column>
                        <Grid.Column>
                            {warningCount > 0 && (
                                <Label color="yellow" size="large">
                                    <Icon name="warning" />
                                    {warningCount} Warning(s)
                                </Label>
                            )}
                        </Grid.Column>
                        <Grid.Column textAlign="right">
                            <Label size="large">
                                <Icon name="list" />
                                {formData.credentials.length} Credential(s)
                            </Label>
                        </Grid.Column>
                    </Grid.Row>
                </Grid>
            </Segment>

            {/* Error/Warning Details */}
            {errors.length > 0 && (
                <Segment>
                    {errors.filter(e => e.severity === "error").length > 0 && (
                        <SemanticMessage negative>
                            <SemanticMessage.Header>Errors</SemanticMessage.Header>
                            <SemanticMessage.List>
                                {errors
                                    .filter(e => e.severity === "error")
                                    .map((e, i) => (
                                        <SemanticMessage.Item key={i}>
                                            <strong>{e.field}:</strong> {e.message}
                                        </SemanticMessage.Item>
                                    ))
                                }
                            </SemanticMessage.List>
                        </SemanticMessage>
                    )}
                    {errors.filter(e => e.severity === "warning").length > 0 && (
                        <SemanticMessage warning>
                            <SemanticMessage.Header>Warnings</SemanticMessage.Header>
                            <SemanticMessage.List>
                                {errors
                                    .filter(e => e.severity === "warning")
                                    .map((e, i) => (
                                        <SemanticMessage.Item key={i}>
                                            <strong>{e.field}:</strong> {e.message}
                                        </SemanticMessage.Item>
                                    ))
                                }
                            </SemanticMessage.List>
                        </SemanticMessage>
                    )}
                </Segment>
            )}

            {/* Summary */}
            <Segment>
                <Grid>
                    <Grid.Row columns={2}>
                        <Grid.Column>
                            <strong>Definition Name:</strong> {formData.name || "(not set)"}
                        </Grid.Column>
                        <Grid.Column>
                            <strong>Purpose:</strong> {formData.purpose || "(not set)"}
                        </Grid.Column>
                    </Grid.Row>
                </Grid>
            </Segment>

            {/* JSON Preview */}
            <Segment>
                <Grid>
                    <Grid.Row>
                        <Grid.Column width={12}>
                            <h4>Generated Presentation Definition JSON</h4>
                        </Grid.Column>
                        <Grid.Column width={4} textAlign="right">
                            <Button
                                basic
                                primary
                                size="small"
                                onClick={handleCopy}
                                data-componentid={`${componentId}-copy-button`}
                            >
                                <Icon name={copied ? "check" : "copy"} />
                                {copied ? "Copied!" : "Copy JSON"}
                            </Button>
                        </Grid.Column>
                    </Grid.Row>
                </Grid>

                <div style={{ border: "1px solid #ccc", marginTop: "1rem" }}>
                    <CodeEditor
                        language="json"
                        sourceCode={generatedJson}
                        readOnly={true}
                        options={{
                            lineWrapping: true,
                            lineNumbers: true
                        }}
                        height="400px"
                        theme="light"
                        data-componentid={`${componentId}-json-editor`}
                    />
                </div>
            </Segment>

            <Hint className="mt-4">
                Review the generated JSON above. If everything looks correct, click
                <strong> Create Definition</strong> to save.
                You can go back to previous steps to make changes.
            </Hint>
        </div>
    );
};

export default PreviewStep;
