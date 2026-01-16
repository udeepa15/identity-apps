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

import { AsgardeoSPAClient, HttpClientInstance } from "@asgardeo/auth-react";
import { RequestConfigInterface } from "@wso2is/admin.core.v1/hooks/use-request";
import { store } from "@wso2is/admin.core.v1/store";
import { HttpMethods } from "@wso2is/core/models";
import { AxiosError, AxiosResponse } from "axios";
import {
    PresentationDefinitionInterface,
    PresentationDefinitionListInterface
} from "../models/presentation-definition";

/**
 * Initialize an axios Http client.
 */
const httpClient: HttpClientInstance =
    AsgardeoSPAClient.getInstance().httpRequest.bind(AsgardeoSPAClient.getInstance());

/**
 * Get the list of presentation definitions.
 *
 * @returns Promise with the list of presentation definitions.
 */
export const getPresentationDefinitions = (): Promise<PresentationDefinitionInterface[]> => {
    const requestConfig: RequestConfigInterface = {
        headers: {
            "Content-Type": "application/json"
        },
        method: HttpMethods.GET,
        url: store.getState().config.endpoints.presentationDefinitions
    };

    console.log("GET /presentation-definitions: Fetching list");

    return httpClient(requestConfig)
        .then((response: AxiosResponse) => {
            console.log("GET /presentation-definitions: Success", response?.data);

            return Promise.resolve(response?.data as PresentationDefinitionInterface[]);
        })
        .catch((error: AxiosError) => {
            console.error("GET /presentation-definitions: Error", {
                data: error?.response?.data,
                message: error?.message,
                status: error?.response?.status
            });

            return Promise.reject(error);
        });
};

/**
 * Get a specific presentation definition.
 *
 * @param id - The ID of the presentation definition.
 * @returns Promise with the presentation definition.
 */
export const getPresentationDefinition = (id: string): Promise<PresentationDefinitionInterface> => {
    const requestConfig: RequestConfigInterface = {
        headers: {
            "Content-Type": "application/json"
        },
        method: HttpMethods.GET,
        url: `${store.getState().config.endpoints.presentationDefinitions}/${id}`
    };

    console.log(`GET /presentation-definitions/${id}: Fetching definition`);

    return httpClient(requestConfig)
        .then((response: AxiosResponse) => {
            console.log(`GET /presentation-definitions/${id}: Success`, response?.data);

            return Promise.resolve(response?.data);
        })
        .catch((error: AxiosError) => {
            console.error(`GET /presentation-definitions/${id}: Error`, {
                data: error?.response?.data,
                message: error?.message,
                status: error?.response?.status
            });

            return Promise.reject(error);
        });
};

/**
 * Create a new presentation definition.
 *
 * @param data - The presentation definition data.
 * @returns Promise with the created presentation definition.
 */
export const createPresentationDefinition = (
    data: PresentationDefinitionInterface
): Promise<PresentationDefinitionInterface> => {
    const requestConfig: RequestConfigInterface = {
        data,
        headers: {
            "Content-Type": "application/json"
        },
        method: HttpMethods.POST,
        url: store.getState().config.endpoints.presentationDefinitions
    };

    console.log("POST /presentation-definitions: Creating definition", data);

    return httpClient(requestConfig)
        .then((response: AxiosResponse) => {
            console.log("POST /presentation-definitions: Success", response?.data);

            return Promise.resolve(response?.data);
        })
        .catch((error: AxiosError) => {
            console.error("POST /presentation-definitions: Error", {
                data: error?.response?.data,
                message: error?.message,
                status: error?.response?.status
            });

            return Promise.reject(error);
        });
};

/**
 * Update a presentation definition.
 *
 * @param id - The ID of the presentation definition.
 * @param data - The updated presentation definition data.
 * @returns Promise with the updated presentation definition.
 */
export const updatePresentationDefinition = (
    id: string,
    data: PresentationDefinitionInterface
): Promise<PresentationDefinitionInterface> => {
    const requestConfig: RequestConfigInterface = {
        data,
        headers: {
            "Content-Type": "application/json"
        },
        method: HttpMethods.PUT,
        url: `${store.getState().config.endpoints.presentationDefinitions}/${id}`
    };

    console.log(`PUT /presentation-definitions/${id}: Updating definition`, data);

    return httpClient(requestConfig)
        .then((response: AxiosResponse) => {
            console.log(`PUT /presentation-definitions/${id}: Success`, response?.data);

            return Promise.resolve(response?.data);
        })
        .catch((error: AxiosError) => {
            console.error(`PUT /presentation-definitions/${id}: Error`, {
                data: error?.response?.data,
                message: error?.message,
                status: error?.response?.status
            });

            return Promise.reject(error);
        });
};

/**
 * Delete a presentation definition.
 *
 * @param id - The ID of the presentation definition.
 * @returns Promise with the response.
 */
export const deletePresentationDefinition = (id: string): Promise<AxiosResponse> => {
    const requestConfig: RequestConfigInterface = {
        headers: {
            "Content-Type": "application/json"
        },
        method: HttpMethods.DELETE,
        url: `${store.getState().config.endpoints.presentationDefinitions}/${id}`
    };

    console.log(`DELETE /presentation-definitions/${id}: Deleting definition`);

    return httpClient(requestConfig)
        .then((response: AxiosResponse) => {
            console.log(`DELETE /presentation-definitions/${id}: Success`, response?.data);

            return Promise.resolve(response);
        })
        .catch((error: AxiosError) => {
            console.error(`DELETE /presentation-definitions/${id}: Error`, {
                data: error?.response?.data,
                message: error?.message,
                status: error?.response?.status
            });

            return Promise.reject(error);
        });
};

/**
 * Get application presentation definition mapping.
 *
 * @param applicationId - The ID of the application.
 * @returns Promise with the mapping.
 */
export const getApplicationPresentationDefinitionMapping = (
    applicationId: string
): Promise<{ applicationId: string; presentationDefinitionId: string }> => {
    const requestConfig: RequestConfigInterface = {
        headers: {
            "Content-Type": "application/json"
        },
        method: HttpMethods.GET,
        url: `${store.getState().config.endpoints.presentationDefinitions}/mapping/${applicationId}`
    };

    console.log(`GET /presentation-definitions/mapping/${applicationId}: Fetching mapping`);

    return httpClient(requestConfig)
        .then((response: AxiosResponse) => {
            console.log(`GET /presentation-definitions/mapping/${applicationId}: Success`, response?.data);

            return Promise.resolve(response?.data);
        })
        .catch((error: AxiosError) => {
            // 404 is expected when no mapping exists
            if (error?.response?.status === 404) {
                console.log(`GET /presentation-definitions/mapping/${applicationId}: No mapping found (404)`);

                return Promise.resolve(null);
            }

            console.error(`GET /presentation-definitions/mapping/${applicationId}: Error`, {
                data: error?.response?.data,
                message: error?.message,
                status: error?.response?.status
            });

            return Promise.reject(error);
        });
};

/**
 * Create or update application presentation definition mapping.
 *
 * @param applicationId - The ID of the application.
 * @param presentationDefinitionId - The ID of the presentation definition.
 * @returns Promise with the response.
 */
export const createOrUpdateApplicationPresentationDefinitionMapping = (
    applicationId: string,
    presentationDefinitionId: string
): Promise<AxiosResponse> => {
    const requestConfig: RequestConfigInterface = {
        data: {
            applicationId,
            presentationDefinitionId
        },
        headers: {
            "Content-Type": "application/json"
        },
        method: HttpMethods.POST,
        url: `${store.getState().config.endpoints.presentationDefinitions}/mapping`
    };

    console.log(`POST /presentation-definitions/mapping: Creating/updating mapping for ${applicationId}`);

    return httpClient(requestConfig)
        .then((response: AxiosResponse) => {
            console.log(`POST /presentation-definitions/mapping: Success`, response?.data);

            return Promise.resolve(response);
        })
        .catch((error: AxiosError) => {
            console.error(`POST /presentation-definitions/mapping: Error`, {
                data: error?.response?.data,
                message: error?.message,
                status: error?.response?.status
            });

            return Promise.reject(error);
        });
};

/**
 * Delete application presentation definition mapping.
 *
 * @param applicationId - The ID of the application.
 * @returns Promise with the response.
 */
export const deleteApplicationPresentationDefinitionMapping = (
    applicationId: string
): Promise<AxiosResponse> => {
    const requestConfig: RequestConfigInterface = {
        headers: {
            "Content-Type": "application/json"
        },
        method: HttpMethods.DELETE,
        url: `${store.getState().config.endpoints.presentationDefinitions}/mapping/${applicationId}`
    };

    console.log(`DELETE /presentation-definitions/mapping/${applicationId}: Deleting mapping`);

    return httpClient(requestConfig)
        .then((response: AxiosResponse) => {
            console.log(`DELETE /presentation-definitions/mapping/${applicationId}: Success`);

            return Promise.resolve(response);
        })
        .catch((error: AxiosError) => {
            console.error(`DELETE /presentation-definitions/mapping/${applicationId}: Error`, {
                data: error?.response?.data,
                message: error?.message,
                status: error?.response?.status
            });

            return Promise.reject(error);
        });
};
