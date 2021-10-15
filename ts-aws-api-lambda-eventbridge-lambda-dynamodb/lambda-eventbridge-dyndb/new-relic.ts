import * as pulumi from "@pulumi/pulumi";
import { Input, Output } from "@pulumi/pulumi";
import * as newrelic from "@pulumi/newrelic";
import { accountId } from "@pulumi/newrelic/config";

interface DashboardArgs {
  appName: string;
};

export class Dashboard extends pulumi.ComponentResource {
  public readonly url: Output<string>;

  constructor(name: string, args: DashboardArgs, opts?: pulumi.ComponentResourceOptions) {
    super("custom:EventProcessor:Dashboard", name, args, opts)
    const nameBase = `${args.appName}-${name}`

    // Assume no account info provided.
    this.url = pulumi.interpolate`*** No dashboard URL provided since New Relic account information is missing. ***`

    // But, if it is, create a dashboard.
    if (accountId) { 
      const dashboard = new newrelic.OneDashboard(`${name}-onedashboard`, {
        name: `${nameBase}-stats`, 
        permissions: "public_read_only",
        pages: [{
                  name: `${nameBase}-stats`, 
                  widgetMarkdowns: [{title: "Dashboard Notes", row: 1, column: 9, text: "### Helpful Links\n\n* [New Relic One](https://one.newrelic.com)\n* [Developer Portal](https://developer.newrelic.com)"}],
                  widgetLines: [{
                    title: `${nameBase} Average Response Time`,
                    row: 1,
                    column: 1,
                    nrqlQueries: [{
                      accountId: Number(accountId),
                      query: `SELECT average(duration * 1000) AS 'Response time' FROM Transaction TIMESERIES SINCE 1800 seconds ago EXTRAPOLATE`
                    }]
                  }],
                }],
      }, {parent: this})
      this.url = dashboard.permalink
    }
  }
}
