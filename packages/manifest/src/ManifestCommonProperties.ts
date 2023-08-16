// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

export interface ManifestCommonProperties {
  /**
   * Capabilities, e.g. "staticTab" | "configurableTab" | "MessageExtension" | "WebApplicationInfo"
   */
  capabilities: string[];
  /**
   * Teams app id
   */
  id: string;
  /**
   * Teams app version, e.g.1.0.0
   */
  version: string;
  /**
   * manifest version, e.g. 1.16
   */
  manifestVersion: string;
  /**
   * Whether it's copilot plugin app
   */
  isCopilotPlugin: boolean;
  /**
   * Whether it's SPFx Teams app
   */
  isSPFx: boolean;

  /**
   * Whether it's apiBased MessageExtension but not copilot plugin
   */
  isApiBasedMe: boolean;
}
