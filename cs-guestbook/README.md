# Demo Overview
**NOTE** This demo uses the `K8sServiceDeployment` package generated in the ce/demos multilanguage-packages folder. 

This demo highlights the following:
- C# support: It is written in C#.
- Multilanguage Packages: It uses a C# package generated from a Golang provider.
- Multistack Architecture: Deploys base EKS cluster infrastructure and the layers on a "Guestbook" application using multiple services deployed using the `K8sServiceDeployment` package.

# Demo Steps
## Prelaunch EKS or AKS Cluster
It takes several minutes for cluster to launch and so you should launch the EKS cluster stack ahead of the demo.

See `eks-base-infra/README.md` for deployment steps.
or
See `aks-base-infra/README.md` for deployment steps.

## Prepare the GuestBook Service Project
The GuestBook stack launches quickly - only takes about a minute to come up and so can be run during the demo itself.   

See `guestbook-app/README.md` for deployment steps.
