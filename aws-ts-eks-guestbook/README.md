# Demo Overview
**NOTE** This demo uses the `K8sServiceDeployment` package generated in the multilanguage-packages folder. 

This demo highlights the following:
- Python support: It is written in python.
- Multilanguage Packages: It uses a python module package generated from a Golang provider.
- Multistack Architecture: Deploys base EKS cluster infrastructure and the layers on a "Guestbook" application using multiple services deployed using the `K8sServiceDeployment` package.

# Demo Steps
## Prelaunch EKS Cluster
It takes a solid 10-15 minutes for EKS cluster to launch and so you should launch the EKS cluster stack ahead of the demo.

See `eks-base-infra/README.md` for deployment steps.

## Prepare the GuestBook Service Project
The GuestBook stack launches quickly - only takes about a minute to come up and so can be run during the demo itself.   

See `guestbook-app/README.md` for deployment steps.

