// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { AzureScopes } from "@microsoft/teamsfx-core/build/common/tools";
import axios from "axios";
import * as chai from "chai";
import * as fs from "fs";
import * as path from "path";

import MockAzureAccountProvider from "@microsoft/teamsapp-cli/src/commonlib/azureLoginUserPassword";
import { getActivePluginsFromProjectSetting } from "../e2e/commonUtils";
import { EnvConstants, PluginId, StateConfigKey } from "./constants";

import {
  getExpectedBotClientSecret,
  getExpectedM365ApplicationIdUri,
  getExpectedM365ClientSecret,
  getContainerAppProperties,
  getSubscriptionIdFromResourceId,
  getResourceGroupNameFromResourceId,
} from "./utilities";

const baseUrlListDeployments = (
  subscriptionId: string,
  rg: string,
  name: string
) =>
  `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${rg}/providers/Microsoft.Web/sites/${name}/deployments?api-version=2019-08-01`;
const baseUrlListDeploymentLogs = (
  subscriptionId: string,
  rg: string,
  name: string,
  id: string
) =>
  `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${rg}/providers/Microsoft.Web/sites/${name}/deployments/${id}/log?api-version=2019-08-01`;

enum BaseConfig {
  BOT_ID = "BOT_ID",
  BOT_PASSWORD = "BOT_PASSWORD",
  INITIATE_LOGIN_ENDPOINT = "INITIATE_LOGIN_ENDPOINT",
  M365_APPLICATION_ID_URI = "M365_APPLICATION_ID_URI",
  M365_AUTHORITY_HOST = "M365_AUTHORITY_HOST",
  M365_CLIENT_ID = "M365_CLIENT_ID",
  M365_CLIENT_SECRET = "M365_CLIENT_SECRET",
  IDENTITY_ID = "IDENTITY_ID",
  M365_TENANT_ID = "M365_TENANT_ID",
}
enum FunctionConfig {
  API_ENDPOINT = "API_ENDPOINT",
}
enum SQLConfig {
  SQL_DATABASE_NAME = "SQL_DATABASE_NAME",
  SQL_ENDPOINT = "SQL_ENDPOINT",
}
export class ContainerAppValidator {
  private ctx: any;
  private projectPath: string;
  private env: string;
  private subscriptionId: string;
  private rg: string;
  private containerAppName: string;

  constructor(ctx: any, projectPath: string, env: string) {
    console.log("Start to init validator for Azure Container App.");

    console.log("ctx:" + JSON.stringify(ctx, null, 2));
    this.ctx = ctx;
    this.projectPath = projectPath;
    this.env = env;

    const resourceId = ctx[EnvConstants.AZURE_CONTAINER_APP_RESOURCE_ID];
    chai.assert.exists(resourceId);
    this.subscriptionId = getSubscriptionIdFromResourceId(resourceId);
    chai.assert.exists(this.subscriptionId);
    this.rg = getResourceGroupNameFromResourceId(resourceId);
    chai.assert.exists(this.rg);
    this.containerAppName = this.ctx[EnvConstants.AZURE_CONTAINER_APP_NAME];
    chai.assert.exists(this.containerAppName);

    console.log("Successfully init validator for Azure Container App.");
  }

  public async validateProvision(includeAAD = true): Promise<void> {
    console.log("Start to validate Azure Container App Provision.");

    const tokenProvider = MockAzureAccountProvider;
    const tokenCredential = await tokenProvider.getIdentityCredentialAsync();
    const token = (await tokenCredential?.getToken(AzureScopes))?.token;

    console.log("Validating env variables");
    console.log("subscriptionId", this.subscriptionId);
    console.log("rg", this.rg);
    console.log("containerAppName", this.containerAppName);
    const response = await getContainerAppProperties(
      this.subscriptionId,
      this.rg,
      this.containerAppName,
      token as string
    );
    console.log("response:" + JSON.stringify(response, null, 2));
    chai.assert.exists(response);
    console.log("Successfully validate Azure Container App Provision.");
  }

  public async validateDeploy(): Promise<void> {
    // ToDo: uncomment this function in the future.
    /*
        console.log("Start to validate Bot Deployment.");

        const tokenProvider: MockAzureAccountProvider = MockAzureAccountProvider.getInstance();
        const tokenCredential = await tokenProvider.getAccountCredentialAsync();
        const token = (await tokenCredential?.getToken())?.accessToken;

        const deployments = await this.getDeployments(this.subscriptionId, this.rg, botObject.siteName, token as string);
        const deploymentId = deployments?.[0]?.properties?.id;
        const deploymentLog = await this.getDeploymentLog(this.subscriptionId, this.rg, botObject.siteName, token as string, deploymentId!);

        chai.assert.exists(deploymentLog?.find((item: any) => item.properties.message === "Deployment successful."));
        console.log("Successfully validate Bot Deployment.");
        */
  }

  private static async getDeployments(
    subscriptionId: string,
    rg: string,
    name: string,
    token: string
  ) {
    try {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      const getResponse = await axios.get(
        baseUrlListDeployments(subscriptionId, rg, name)
      );

      return getResponse?.data?.value;
    } catch (error) {
      console.log(error);
      return undefined;
    }
  }

  private static async getDeploymentLog(
    subscriptionId: string,
    rg: string,
    name: string,
    token: string,
    id: string
  ) {
    try {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      const getResponse = await axios.get(
        baseUrlListDeploymentLogs(subscriptionId, rg, name, id)
      );

      return getResponse?.data?.value;
    } catch (error) {
      console.log(error);
      return undefined;
    }
  }
}
