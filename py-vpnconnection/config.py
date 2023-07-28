# Config stuff.
# It's nice to put it in a separate file to keep from muddying the main program with 
# these details.

import pulumi

config = pulumi.Config()

# NOT SURE WHAT THIS NAME IS. It's in the provided TF code and appended to tenant_id for tags
# If not set, use the stack name. 
name = config.get("name") or pulumi.get_stack()

tenant_id = config.require("tenant_id")
customer_gateway_id = config.get("customer_gateway_id") # optional. if not set program will create a customer gateway
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

