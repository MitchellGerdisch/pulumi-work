import * as storage from "@pulumi/azure-native/storage";
import { ComponentResource, ComponentResourceOptions, Input, Output } from "@pulumi/pulumi";
import * as pulumi from "@pulumi/pulumi";

export interface StorageInfraArgs {
    resourceGroupName: Input<string>;
};

export class StorageInfra extends ComponentResource {
    public readonly storageAccountName: Output<string>;
    public readonly storageKey: Output<string>;

    // Must have a constructor that defines the parameters and namespace - "custom:x:Storage" in this case.
    constructor(name: string, args: StorageInfraArgs, opts?: ComponentResourceOptions) {
        super("custom:x:StorageInfra", name, args, opts);


        // Storage Account name must be lowercase and cannot have any dash characters
        const storageAccount = new storage.StorageAccount(`${name.replace(/[^A-Za-z0-9]/g, '').toLowerCase()}sa`, {
            resourceGroupName: args.resourceGroupName,
            kind: storage.Kind.StorageV2,
            sku: {
                name: storage.SkuName.Standard_LRS,
            },
        }, {parent: this});

        const storageAccountKeys = pulumi.all([args.resourceGroupName, storageAccount.name]).apply(([resourceGroupName, accountName]) =>
            storage.listStorageAccountKeys({ resourceGroupName, accountName }));
        
        // Specify returned properties
        this.storageAccountName = storageAccount.name;
        this.storageKey = pulumi.secret(storageAccountKeys.keys[0].value);

        // End with this. It is used for display purposes.
        this.registerOutputs();
    };
};