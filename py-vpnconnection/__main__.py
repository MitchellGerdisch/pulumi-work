import pulumi
import pulumi_aws as aws
import config

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

