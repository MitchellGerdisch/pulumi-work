from pulumi import ComponentResource, ResourceOptions
from pulumi_aws import rds

class VpnArgs:

    def __init__(self,
                tenant_id:str = None,
                customer_gateway_id:str = None,
                enable_acceleration=config.get("enable_acceleration") or True # We are using an ec2 transit gateway so True seems like a good default
                type = config.get("type") or "ipsec.1" # currently only ipsec.1 is supported so default to that if no config set

# static_routes are provided as an array in a structured config
static_routes = config.require_object("static_routes")
static_routes_only=True if len(static_routes) > 0 else False

tenant_bgp_asn = config.require("tenant_gbp_asn")
tenant_public_ip = config.require("tenant_public_ip")
local_ipv4_network_cidr = config.require("local_ipv4_network_cidr")
remote_ipv4_network_cidr = config.require("remote_ipv4_network_cidr")
transit_gateway_id=config.require("transit_gateway_id")
association_default_route_table_id=config.require("association_default_route_table_id")

# tunnel 1 configs
tunnel1_dpd_timeout_action=config.require("tunnel1_dpd_timeout_action")
tunnel1_dpd_timeout_seconds=config.require_int("tunnel1_dpd_timeout_seconds")
tunnel1_ike_versions=config.require("tunnel1_ike_versions")
tunnel1_inside_cidr=config.require("tunnel1_inside_cidr")
tunnel1_phase1_dh_group_numbers=config.require_object("tunnel1_phase1_dh_group_numbers")
tunnel1_phase1_encryption_algorithms=config.require_object("tunnel1_phase1_encryption_algorithms")
tunnel1_phase1_integrity_algorithms=config.require_object("tunnel1_phase1_integrity_algorithms")
tunnel1_phase1_lifetime_seconds=config.require_int("tunnel1_phase1_lifetime_seconds")
tunnel1_phase2_dh_group_numbers=config.require_object("tunnel1_phase2_dh_group_numbers")
tunnel1_phase2_encryption_algorithms=config.require_object("tunnel1_phase2_encryption_algorithms")
tunnel1_phase2_integrity_algorithms=config.require_object("tunnel1_phase2_integrity_algorithms")
tunnel1_phase2_lifetime_seconds=config.require_int("tunnel1_phase2_lifetime_seconds")
tunnel1_preshared_key=config.require("tunnel1_preshared_key")
tunnel1_rekey_fuzz_percentage=config.require_int("tunnel1_rekey_fuzz_percentage")
tunnel1_rekey_margin_time_seconds=config.require_int("tunnel1_rekey_margin_time_seconds")
tunnel1_replay_window_size=config.require("tunnel1_replay_window_size")
tunnel1_startup_action=config.require("tunnel1_startup_action")

# tunnel 2 configs
tunnel2_dpd_timeout_action=config.require("tunnel2_dpd_timeout_action")
tunnel2_dpd_timeout_seconds=config.require_int("tunnel2_dpd_timeout_seconds")
tunnel2_ike_versions=config.require("tunnel2_ike_versions")
tunnel2_inside_cidr=config.require("tunnel2_inside_cidr")
tunnel2_phase1_dh_group_numbers=config.require("tunnel2_phase1_dh_group_numbers")
tunnel2_phase1_encryption_algorithms=config.require("tunnel2_phase1_encryption_algorithms")
tunnel2_phase1_integrity_algorithms=config.require("tunnel2_phase1_integrity_algorithms")
tunnel2_phase1_lifetime_seconds=config.require_int("tunnel2_phase1_lifetime_seconds")
tunnel2_phase2_dh_group_numbers=config.require("tunnel2_phase2_dh_group_numbers")
tunnel2_phase2_encryption_algorithms=config.require("tunnel2_phase2_encryption_algorithms")
tunnel2_phase2_integrity_algorithms=config.require("tunnel2_phase2_integrity_algorithms")
tunnel2_phase2_lifetime_seconds=config.require_int("tunnel2_phase2_lifetime_seconds")
tunnel2_preshared_key=config.require("tunnel2_preshared_key")
tunnel2_rekey_fuzz_percentage=config.require("tunnel2_rekey_fuzz_percentage")
tunnel2_rekey_margin_time_seconds=config.require_int("tunnel2_rekey_margin_time_seconds")
tunnel2_replay_window_size=config.require("tunnel2_replay_window_size")
tunnel2_startup_action=config.require("tunnel2_startup_action")
        ):

        self.db_name = db_name
        self.db_user = db_user
        self.db_password = db_password
        self.subnet_ids = subnet_ids
        self.security_group_ids = security_group_ids
        self.allocated_storage = allocated_storage
        self.engine = engine
        self.engine_version = engine_version
        self.instance_class = instance_class
        self.storage_type = storage_type
        self.skip_final_snapshot = skip_final_snapshot
        self.publicly_accessible = publicly_accessible


class Db(ComponentResource):

    def __init__(self,
                 name: str,
                 args: DbArgs,
                 opts: ResourceOptions = None):

        super().__init__('custom:resource:Backend', name, {}, opts)

        # Create RDS subnet group to put RDS instance on.
        subnet_group_name = f'{name}-sng'
        rds_subnet_group = rds.SubnetGroup(subnet_group_name,
            subnet_ids=args.subnet_ids,
            tags={

name = config.name
tenant_id = config.tenant_id

# Set up tags structure 
tags = {
    'Name': f"{tenant_id}-{name}",
    'portx.io/tenant-id': f"{tenant_id}"
}

# If no customer gateway id is provided, then create a customer gateway
customer_gateway_id = config.customer_gateway_id
if not customer_gateway_id:
    customer_gateway = aws.ec2.CustomerGateway(f"customerGateway-{name}",
        bgp_asn=config.tenant_bgp_asn,
        ip_address=config.tenant_public_ip,
        type=config.type,
        tags=tags
    )
    customer_gateway_id = customer_gateway.id

vpn = aws.ec2.VpnConnection(f"vpnConnection-{stack_name}",
    customer_gateway_id=customer_gateway_id,
    enable_acceleration=config.enable_acceleration,
    local_ipv4_network_cidr=config.local_ipv4_network_cidr,
    remote_ipv4_network_cidr=config.remote_ipv4_network_cidr,
    static_routes_only=config.static_routes_only,
    transit_gateway_id=config.transit_gateway_id,
    type=config.type,
    tunnel1_dpd_timeout_action=config.tunnel1_dpd_timeout_action,
    tunnel1_dpd_timeout_seconds=config.tunnel1_dpd_timeout_seconds,
    tunnel1_ike_versions=config.tunnel1_ike_versions,
    tunnel1_inside_cidr=config.tunnel1_inside_cidr,
    tunnel1_phase1_dh_group_numbers=config.tunnel1_phase1_dh_group_numbers,
    tunnel1_phase1_encryption_algorithms=config.tunnel1_phase1_encryption_algorithms,
    tunnel1_phase1_integrity_algorithms=config.tunnel1_phase1_integrity_algorithms,
    tunnel1_phase1_lifetime_seconds=config.tunnel1_phase1_lifetime_seconds,
    tunnel1_phase2_dh_group_numbers=config.tunnel1_phase2_dh_group_numbers,
    tunnel1_phase2_encryption_algorithms=config.tunnel1_phase2_encryption_algorithms,
    tunnel1_phase2_integrity_algorithms=config.tunnel1_phase2_integrity_algorithms,
    tunnel1_phase2_lifetime_seconds=config.tunnel1_phase2_lifetime_seconds,
    tunnel1_preshared_key=config.tunnel1_preshared_key,
    tunnel1_rekey_fuzz_percentage=config.tunnel1_rekey_fuzz_percentage,
    tunnel1_rekey_margin_time_seconds=config.tunnel1_rekey_margin_time_seconds,
    tunnel1_replay_window_size=config.tunnel1_replay_window_size,
    tunnel1_startup_action=config.tunnel1_startup_action,
    tunnel2_dpd_timeout_action=config.tunnel2_dpd_timeout_action,
    tunnel2_dpd_timeout_seconds=config.tunnel2_dpd_timeout_seconds,
    tunnel2_ike_versions=config.tunnel2_ike_versions,
    tunnel2_inside_cidr=config.tunnel2_inside_cidr,
    tunnel2_phase1_dh_group_numbers=config.tunnel2_phase1_dh_group_numbers,
    tunnel2_phase1_encryption_algorithms=config.tunnel2_phase1_encryption_algorithms,
    tunnel2_phase1_integrity_algorithms=config.tunnel2_phase1_integrity_algorithms,
    tunnel2_phase1_lifetime_seconds=config.tunnel2_phase1_lifetime_seconds,
    tunnel2_phase2_dh_group_numbers=config.tunnel2_phase2_dh_group_numbers,
    tunnel2_phase2_encryption_algorithms=config.tunnel2_phase2_encryption_algorithms,
    tunnel2_phase2_integrity_algorithms=config.tunnel2_phase2_integrity_algorithms,
    tunnel2_phase2_lifetime_seconds=config.tunnel2_phase2_lifetime_seconds,
    tunnel2_preshared_key=config.tunnel2_preshared_key,
    tunnel2_rekey_fuzz_percentage=config.tunnel2_rekey_fuzz_percentage,
    tunnel2_rekey_margin_time_seconds=config.tunnel2_rekey_margin_time_seconds,
    tunnel2_replay_window_size=config.tunnel2_replay_window_size,
    tunnel2_startup_action=config.tunnel2_startup_action,
    tags=tags
)
    
for static_route, index in enumerate(config.static_routes):
    aws.ec2transitgateway.Route(f"vpnResource-{index}",
        destination_cidr_block=static_route,
        transit_gateway_attachment_id=vpn.transit_gateway_attachment_id,
        transit_gateway_route_table_id=config.association_default_route_table_id,
    )

