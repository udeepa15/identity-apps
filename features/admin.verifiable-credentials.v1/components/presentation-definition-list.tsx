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

import { getEmptyPlaceholderIllustrations } from "@wso2is/admin.core.v1/configs/ui";
import { AppConstants } from "@wso2is/admin.core.v1/constants/app-constants";
import { history } from "@wso2is/admin.core.v1/helpers/history";
import { AlertLevels, IdentifiableComponentInterface } from "@wso2is/core/models";
import { addAlert } from "@wso2is/core/store";
import {
    AnimatedAvatar,
    AppAvatar,
    ConfirmationModal,
    DataTable,
    EmptyPlaceholder,
    PrimaryButton,
    TableActionsInterface,
    TableColumnInterface
} from "@wso2is/react-components";
import React, { ReactElement, ReactNode, SyntheticEvent, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { Header, Icon, SemanticICONS } from "semantic-ui-react";
import { deletePresentationDefinition } from "../api/presentation-definition";
import { PresentationDefinitionInterface } from "../models/presentation-definition";

interface PresentationDefinitionListProps extends IdentifiableComponentInterface {
    advancedSearch?: ReactNode;
    isLoading: boolean;
    mutateList: () => void;
    list: PresentationDefinitionInterface[];
    onSearchQueryClear?: () => void;
    searchQuery?: string;
    onAddClick: () => void;
}

/**
 * Presentation Definition list component.
 *
 * @param props - Props injected to the component.
 * @returns React element.
 */
export const PresentationDefinitionList = ({
    advancedSearch,
    isLoading,
    list,
    mutateList,
    onAddClick,
    ["data-componentid"]: componentId = "presentation-definition-list"
}: PresentationDefinitionListProps): ReactElement => {
    const dispatch: any = useDispatch();
    const { t } = useTranslation();

    const [showDeleteConfirmation, setShowDeleteConfirmationModal] = useState<boolean>(false);
    const [currentDeletedItem, setCurrentDeletedItem] = useState<PresentationDefinitionInterface>();

    /**
     * Handles deletion.
     *
     * @param item - Item to be deleted.
     */
    const handleDelete = (item: PresentationDefinitionInterface): void => {
        deletePresentationDefinition(item.definitionId)
            .then(() => {
                dispatch(
                    addAlert({
                        description: t(
                            "verifiableCredentials:notifications.deleteTemplate.success.description"
                        ),
                        level: AlertLevels.SUCCESS,
                        message: t("verifiableCredentials:notifications.deleteTemplate.success.message")
                    })
                );
                mutateList();
            })
            .catch(() => {
                dispatch(
                    addAlert({
                        description: t(
                            "verifiableCredentials:notifications.deleteTemplate.error.description"
                        ),
                        level: AlertLevels.ERROR,
                        message: t("verifiableCredentials:notifications.deleteTemplate.error.message")
                    })
                );
            });
    };

    /**
     * Resolves table actions.
     *
     * @returns Table actions.
     */
    const resolveTableActions = (): TableActionsInterface[] => {
        return [
            {
                "data-componentid": `${componentId}-item-edit-button`,
                hidden: (): boolean => false,
                icon: (): SemanticICONS => "pencil alternate",
                onClick: (_e: SyntheticEvent, item: PresentationDefinitionInterface): void =>
                    history.push(
                        AppConstants.getPaths().get("PRESENTATION_DEFINITION_EDIT").replace(":id", item.definitionId)
                    ),
                popupText: (): string => t("common:edit"),
                renderer: "semantic-icon"
            },
            {
                "data-componentid": `${componentId}-item-delete-button`,
                hidden: (): boolean => false,
                icon: (): SemanticICONS => "trash alternate",
                onClick: (_e: SyntheticEvent, item: PresentationDefinitionInterface): void => {
                    setCurrentDeletedItem(item);
                    setShowDeleteConfirmationModal(true);
                },
                popupText: (): string => t("common:delete"),
                renderer: "semantic-icon"
            }
        ];
    };

    /**
     * Resolves data table columns.
     *
     * @returns Table columns.
     */
    const resolveTableColumns = (): TableColumnInterface[] => {
        return [
            {
                allowToggleVisibility: false,
                dataIndex: "name",
                id: "name",
                key: "name",
                render: (item: PresentationDefinitionInterface): ReactNode => {
                    return (
                        <Header
                            image
                            as="h6"
                            className="header-with-icon"
                            data-componentid={`${componentId}-item-heading`}
                        >
                            <AppAvatar
                                image={
                                    (<AnimatedAvatar
                                        name={item.name}
                                        size="mini"
                                        data-componentid={`${componentId}-item-avatar`}
                                    />)
                                }
                                size="mini"
                                spaced="right"
                                data-componentid={`${componentId}-item-image`}
                            />
                            <Header.Content>
                                {item?.name}
                                <Header.Subheader>{item?.description}</Header.Subheader>
                            </Header.Content>
                        </Header>
                    );
                },
                title: t("verifiableCredentials:list.columns.name")
            },
            {
                allowToggleVisibility: false,
                dataIndex: "definitionId",
                id: "definitionId",
                key: "definitionId",
                render: (item: PresentationDefinitionInterface): ReactNode => {
                    return <div>{item?.definitionId}</div>;
                },
                title: t("verifiableCredentials:list.columns.identifier")
            },
            {
                allowToggleVisibility: false,
                dataIndex: "action",
                id: "actions",
                key: "actions",
                textAlign: "right",
                title: t("verifiableCredentials:list.columns.actions")
            }
        ];
    };

    /**
     * Shows placeholder when there are no items.
     *
     * @returns React element.
     */
    const showPlaceholders = (): ReactElement => {
        if (!list || list?.length === 0) {
            return (
                <EmptyPlaceholder
                    className="list-placeholder mr-0"
                    action={
                        (<PrimaryButton
                            data-componentid={`${componentId}-empty-placeholder-add-button`}
                            onClick={onAddClick}
                        >
                            <Icon name="add" />
                            {t("verifiableCredentials:buttons.addTemplate")}
                        </PrimaryButton>)
                    }
                    image={getEmptyPlaceholderIllustrations().newList}
                    imageSize="tiny"
                    subtitle={["There are no presentation definitions available."]}
                    data-componentid={`${componentId}-empty-placeholder`}
                />
            );
        }

        return null;
    };

    return (
        <>
            <DataTable<PresentationDefinitionInterface>
                className="presentation-definitions-table"
                externalSearch={advancedSearch}
                isLoading={isLoading}
                actions={resolveTableActions()}
                columns={resolveTableColumns()}
                data={list}
                onRowClick={(_e: SyntheticEvent, item: PresentationDefinitionInterface): void => {
                    history.push(
                        AppConstants.getPaths().get("PRESENTATION_DEFINITION_EDIT").replace(":id", item.definitionId)
                    );
                }}
                placeholders={showPlaceholders()}
                selectable={true}
                showHeader={true}
                transparent={!isLoading && showPlaceholders() !== null}
                data-componentid={componentId}
            />
            {showDeleteConfirmation && (
                <ConfirmationModal
                    data-componentid={`${componentId}-delete-confirmation-modal`}
                    onClose={(): void => setShowDeleteConfirmationModal(false)}
                    type="negative"
                    open={showDeleteConfirmation}
                    assertionHint={t("verifiableCredentials:list.confirmations.deleteItem.assertionHint")}
                    assertionType="checkbox"
                    primaryAction={t("common:confirm")}
                    secondaryAction={t("common:cancel")}
                    onSecondaryActionClick={(): void => setShowDeleteConfirmationModal(false)}
                    onPrimaryActionClick={(): void => {
                        handleDelete(currentDeletedItem);
                        setShowDeleteConfirmationModal(false);
                    }}
                    closeOnDimmerClick={false}
                >
                    <ConfirmationModal.Header>
                        {t("verifiableCredentials:list.confirmations.deleteItem.header")}
                    </ConfirmationModal.Header>
                    <ConfirmationModal.Message attached negative>
                        {t("verifiableCredentials:list.confirmations.deleteItem.message")}
                    </ConfirmationModal.Message>
                    <ConfirmationModal.Content>
                        {t("verifiableCredentials:list.confirmations.deleteItem.content")}
                    </ConfirmationModal.Content>
                </ConfirmationModal>
            )}
        </>
    );
};
