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

import { AppConstants } from "@wso2is/admin.core.v1/constants/app-constants";
import { history } from "@wso2is/admin.core.v1/helpers/history";
import { AlertInterface, AlertLevels, IdentifiableComponentInterface } from "@wso2is/core/models";
import { addAlert } from "@wso2is/core/store";
import {
    ListLayout,
    PageLayout,
    PrimaryButton
} from "@wso2is/react-components";
import React, { ReactElement, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { Dispatch } from "redux";
import { Icon } from "semantic-ui-react";
import { PresentationDefinitionList } from "../components/presentation-definition-list";
import { useGetPresentationDefinitions } from "../hooks/use-get-presentation-definitions";

type PresentationDefinitionListPageProps = IdentifiableComponentInterface;

/**
 * Presentation Definition list page.
 *
 * @param props - Props injected to the component.
 * @returns React element.
 */
const PresentationDefinitionListPage = ({
    "data-componentid": componentId = "presentation-definition-list-page"
}: PresentationDefinitionListPageProps): ReactElement => {
    const { t } = useTranslation();
    const dispatch: Dispatch = useDispatch();

    const {
        data: definitionList,
        isLoading: isListLoading,
        error: listError,
        mutate: mutateList
    } = useGetPresentationDefinitions();

    /**
     * Handle fetch errors.
     */
    useEffect(() => {
        if (listError) {
            dispatch(addAlert<AlertInterface>({
                description: t("verifiableCredentials:notifications.fetchTemplates.error.description"),
                level: AlertLevels.ERROR,
                message: t("verifiableCredentials:notifications.fetchTemplates.error.message")
            }));
        }
    }, [listError]);

    const handleAddClick = (): void => {
        history.push(AppConstants.getPaths().get("PRESENTATION_DEFINITION_EDIT").replace(":id", "new"));
    };

    return (
        <PageLayout
            pageTitle="Presentation Definitions"
            title="Presentation Definitions"
            description="Manage presentation definitions for OpenID4VP."
            data-componentid={`${componentId}-page-layout`}
            bottomMargin={false}
            contentTopMargin={true}
            pageHeaderMaxWidth={false}
            action={
                definitionList?.length > 0 && !isListLoading && (
                    <PrimaryButton
                        onClick={handleAddClick}
                        data-componentid={`${componentId}-add-button`}
                    >
                        <Icon name="add" />
                        New Definition
                    </PrimaryButton>
                )
            }
        >
            <ListLayout
                currentListSize={definitionList?.length ?? 0}
                isLoading={isListLoading}
                showPagination={false}
                onPageChange={() => { /* dummy */ }}
                showTopActionPanel={
                    isListLoading || (definitionList?.length > 0)
                }
                totalPages={1}
                totalListSize={definitionList?.length ?? 0}
                data-componentid={`${componentId}-list-layout`}
            >
                <PresentationDefinitionList
                    mutateList={mutateList}
                    isLoading={isListLoading}
                    list={definitionList ?? []}
                    onAddClick={handleAddClick}
                    data-componentid={`${componentId}-list`}
                />
            </ListLayout>
        </PageLayout>
    );
};

export default PresentationDefinitionListPage;
