import pulumi
import pulumi_aws as aws

# Python module to gather up and process the stack config inputs
import config

# VPN connection component resource
from vpn_component import Vpn, VpnArgs

# The VPN connection, etc code is in a reusable component resource
vpn = Vpn(config.name, VpnArgs(
    tenant_id = config.tenant_id,
    customer_gateway_id = config.customer_gateway_id,
    enable_acceleration = config.enable_acceleration,
    type = config.type,
    static_routes = config.static_routes,
    tenant_bgp_asn = config.tenant_bgp_asn,
    tenant_public_ip = config.tenant_public_ip,
    local_ipv4_network_cidr = config.local_ipv4_network_cidr,
    remote_ipv4_network_cidr = config.remote_ipv4_network_cidr,
    transit_gateway_id = config.transit_gateway_id,
    association_default_route_table_id = config.association_default_route_table_id,
    tunnel1_dpd_timeout_action = config.tunnel1_dpd_timeout_action,
    tunnel1_dpd_timeout_seconds = config.tunnel1_dpd_timeout_seconds,
    tunnel1_ike_versions = config.tunnel1_ike_versions,
    tunnel1_inside_cidr = config.tunnel1_inside_cidr,
    tunnel1_phase1_dh_group_numbers = config.tunnel1_phase1_dh_group_numbers,
    tunnel1_phase1_encryption_algorithms = config.tunnel1_phase1_encryption_algorithms,
    tunnel1_phase1_integrity_algorithms = config.tunnel1_phase1_integrity_algorithms,
    tunnel1_phase1_lifetime_seconds = config.tunnel1_phase1_lifetime_seconds,
    tunnel1_phase2_dh_group_numbers = config.tunnel1_phase2_dh_group_numbers,
    tunnel1_phase2_encryption_algorithms = config.tunnel1_phase2_encryption_algorithms,
    tunnel1_phase2_integrity_algorithms = config.tunnel1_phase2_integrity_algorithms,
    tunnel1_phase2_lifetime_seconds = config.tunnel1_phase2_lifetime_seconds,
    tunnel1_preshared_key = config.tunnel1_preshared_key,
    tunnel1_rekey_fuzz_percentage = config.tunnel1_rekey_fuzz_percentage,
    tunnel1_rekey_margin_time_seconds = config.tunnel1_rekey_margin_time_seconds,
    tunnel1_replay_window_size = config.tunnel1_replay_window_size,
    tunnel1_startup_action = config.tunnel1_startup_action,
    tunnel2_dpd_timeout_action = config.tunnel2_dpd_timeout_action,
    tunnel2_dpd_timeout_seconds = config.tunnel2_dpd_timeout_seconds,
    tunnel2_ike_versions = config.tunnel2_ike_versions,
    tunnel2_inside_cidr = config.tunnel2_inside_cidr,
    tunnel2_phase1_dh_group_numbers = config.tunnel2_phase1_dh_group_numbers,
    tunnel2_phase1_encryption_algorithms = config.tunnel2_phase1_encryption_algorithms,
    tunnel2_phase1_integrity_algorithms = config.tunnel2_phase1_integrity_algorithms,
    tunnel2_phase1_lifetime_seconds = config.tunnel2_phase1_lifetime_seconds,
    tunnel2_phase2_dh_group_numbers = config.tunnel2_phase2_dh_group_numbers,
    tunnel2_phase2_encryption_algorithms = config.tunnel2_phase2_encryption_algorithms,
    tunnel2_phase2_integrity_algorithms = config.tunnel2_phase2_integrity_algorithms,
    tunnel2_phase2_lifetime_seconds = config.tunnel2_phase2_lifetime_seconds,
    tunnel2_preshared_key = config.tunnel2_preshared_key,
    tunnel2_rekey_fuzz_percentage = config.tunnel2_rekey_fuzz_percentage,
    tunnel2_rekey_margin_time_seconds = config.tunnel2_rekey_margin_time_seconds,
    tunnel2_replay_window_size = config.tunnel2_replay_window_size,
    tunnel2_startup_action = config.tunnel2_startup_action,
))

