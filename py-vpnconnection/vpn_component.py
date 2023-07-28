from pulumi import ComponentResource, ResourceOptions
import pulumi_aws as aws

class VpnArgs:
    def __init__(self,
                    tenant_id:str = None,
                    customer_gateway_id:str = None,
                    enable_acceleration:bool = None,
                    type:str = None,
                    static_routes:str = [],
                    tenant_bgp_asn:str = None,
                    tenant_public_ip:str = None,
                    local_ipv4_network_cidr:str = None,
                    remote_ipv4_network_cidr:str = None,
                    transit_gateway_id:str = None,
                    association_default_route_table_id:str = None,

                    tunnel1_dpd_timeout_action:str = None,
                    tunnel1_dpd_timeout_seconds:int = None,
                    tunnel1_ike_versions:str = [],
                    tunnel1_inside_cidr:str = None,
                    tunnel1_phase1_dh_group_numbers:str = [],
                    tunnel1_phase1_encryption_algorithms:str = [],
                    tunnel1_phase1_integrity_algorithms:str = [],
                    tunnel1_phase1_lifetime_seconds:int = None,
                    tunnel1_phase2_dh_group_numbers:str = [],
                    tunnel1_phase2_encryption_algorithms:str = [],
                    tunnel1_phase2_integrity_algorithms:str = [],
                    tunnel1_phase2_lifetime_seconds:int = None,
                    tunnel1_preshared_key:str = None,
                    tunnel1_rekey_fuzz_percentage:int = None,
                    tunnel1_rekey_margin_time_seconds:int = None,
                    tunnel1_replay_window_size:str = None,
                    tunnel1_startup_action:str = None,

                    tunnel2_dpd_timeout_action:str = None,
                    tunnel2_dpd_timeout_seconds:int = None,
                    tunnel2_ike_versions:str = None,
                    tunnel2_inside_cidr:str = None,
                    tunnel2_phase1_dh_group_numbers:str = [],
                    tunnel2_phase1_encryption_algorithms:str = [],
                    tunnel2_phase1_integrity_algorithms:str = [],
                    tunnel2_phase1_lifetime_seconds:int = None,
                    tunnel2_phase2_dh_group_numbers:str = [],
                    tunnel2_phase2_encryption_algorithms:str = [],
                    tunnel2_phase2_integrity_algorithms:str = [],
                    tunnel2_phase2_lifetime_seconds:int = None,
                    tunnel2_preshared_key:str = None,
                    tunnel2_rekey_fuzz_percentage:int = None,
                    tunnel2_rekey_margin_time_seconds:int = None,
                    tunnel2_replay_window_size:str = None,
                    tunnel2_startup_action:str = None,
        ):

        self.tenant_id = tenant_id
        self.customer_gateway_id = customer_gateway_id
        self.enable_acceleration = enable_acceleration
        self.type = type
        self.static_routes = static_routes
        self.tenant_bgp_asn = tenant_bgp_asn
        self.tenant_public_ip = tenant_public_ip
        self.local_ipv4_network_cidr = local_ipv4_network_cidr
        self.remote_ipv4_network_cidr = remote_ipv4_network_cidr
        self.transit_gateway_id = transit_gateway_id
        self.association_default_route_table_id = association_default_route_table_id

        self.tunnel1_dpd_timeout_action = tunnel1_dpd_timeout_action
        self.tunnel1_dpd_timeout_seconds = tunnel1_dpd_timeout_seconds
        self.tunnel1_ike_versions = tunnel1_ike_versions
        self.tunnel1_inside_cidr = tunnel1_inside_cidr
        self.tunnel1_phase1_dh_group_numbers = tunnel1_phase1_dh_group_numbers
        self.tunnel1_phase1_encryption_algorithms = tunnel1_phase1_encryption_algorithms
        self.tunnel1_phase1_integrity_algorithms = tunnel1_phase1_integrity_algorithms
        self.tunnel1_phase1_lifetime_seconds = tunnel1_phase1_lifetime_seconds
        self.tunnel1_phase2_dh_group_numbers = tunnel1_phase2_dh_group_numbers
        self.tunnel1_phase2_encryption_algorithms = tunnel1_phase2_encryption_algorithms
        self.tunnel1_phase2_integrity_algorithms = tunnel1_phase2_integrity_algorithms
        self.tunnel1_phase2_lifetime_seconds = tunnel1_phase2_lifetime_seconds
        self.tunnel1_preshared_key = tunnel1_preshared_key
        self.tunnel1_rekey_fuzz_percentage = tunnel1_rekey_fuzz_percentage
        self.tunnel1_rekey_margin_time_seconds = tunnel1_rekey_margin_time_seconds
        self.tunnel1_replay_window_size = tunnel1_replay_window_size
        self.tunnel1_startup_action = tunnel1_startup_action

        self.tunnel2_dpd_timeout_action = tunnel2_dpd_timeout_action
        self.tunnel2_dpd_timeout_seconds = tunnel2_dpd_timeout_seconds
        self.tunnel2_ike_versions = tunnel2_ike_versions
        self.tunnel2_inside_cidr = tunnel2_inside_cidr
        self.tunnel2_phase1_dh_group_numbers = tunnel2_phase1_dh_group_numbers
        self.tunnel2_phase1_encryption_algorithms = tunnel2_phase1_encryption_algorithms
        self.tunnel2_phase1_integrity_algorithms = tunnel2_phase1_integrity_algorithms
        self.tunnel2_phase1_lifetime_seconds = tunnel2_phase1_lifetime_seconds
        self.tunnel2_phase2_dh_group_numbers = tunnel2_phase2_dh_group_numbers
        self.tunnel2_phase2_encryption_algorithms = tunnel2_phase2_encryption_algorithms
        self.tunnel2_phase2_integrity_algorithms = tunnel2_phase2_integrity_algorithms
        self.tunnel2_phase2_lifetime_seconds = tunnel2_phase2_lifetime_seconds
        self.tunnel2_preshared_key = tunnel2_preshared_key
        self.tunnel2_rekey_fuzz_percentage = tunnel2_rekey_fuzz_percentage
        self.tunnel2_rekey_margin_time_seconds = tunnel2_rekey_margin_time_seconds
        self.tunnel2_replay_window_size = tunnel2_replay_window_size
        self.tunnel2_startup_action = tunnel2_startup_action

class Vpn(ComponentResource):

    def __init__(self,
                 name: str,
                 args: VpnArgs,
                 opts: ResourceOptions = None):

        super().__init__('custom:resource:Vpn', name, {}, opts)

        
        static_routes_only=True if len(args.static_routes) > 0 else False


        # Set up tags structure 
        tenant_id = args.tenant_id
        tags = {
            'Name': f"{tenant_id}-{name}",
            'portx.io/tenant-id': f"{tenant_id}"
        }

        # If no customer gateway id is provided, then create a customer gateway
        customer_gateway_id = args.customer_gateway_id
        if not customer_gateway_id:
            customer_gateway = aws.ec2.CustomerGateway(f"{name}-customerGateway",
                bgp_asn=args.tenant_bgp_asn,
                ip_address=args.tenant_public_ip,
                type=args.type,
                tags=tags
            )
            customer_gateway_id = customer_gateway.id

        vpn = aws.ec2.VpnConnection(f"{name}-vpnConnection",
            customer_gateway_id=customer_gateway_id,
            enable_acceleration=args.enable_acceleration,
            local_ipv4_network_cidr=args.local_ipv4_network_cidr,
            remote_ipv4_network_cidr=args.remote_ipv4_network_cidr,
            static_routes_only=args.static_routes_only,
            transit_gateway_id=args.transit_gateway_id,
            type=args.type,
            tunnel1_dpd_timeout_action=args.tunnel1_dpd_timeout_action,
            tunnel1_dpd_timeout_seconds=args.tunnel1_dpd_timeout_seconds,
            tunnel1_ike_versions=args.tunnel1_ike_versions,
            tunnel1_inside_cidr=args.tunnel1_inside_cidr,
            tunnel1_phase1_dh_group_numbers=args.tunnel1_phase1_dh_group_numbers,
            tunnel1_phase1_encryption_algorithms=args.tunnel1_phase1_encryption_algorithms,
            tunnel1_phase1_integrity_algorithms=args.tunnel1_phase1_integrity_algorithms,
            tunnel1_phase1_lifetime_seconds=args.tunnel1_phase1_lifetime_seconds,
            tunnel1_phase2_dh_group_numbers=args.tunnel1_phase2_dh_group_numbers,
            tunnel1_phase2_encryption_algorithms=args.tunnel1_phase2_encryption_algorithms,
            tunnel1_phase2_integrity_algorithms=args.tunnel1_phase2_integrity_algorithms,
            tunnel1_phase2_lifetime_seconds=args.tunnel1_phase2_lifetime_seconds,
            tunnel1_preshared_key=args.tunnel1_preshared_key,
            tunnel1_rekey_fuzz_percentage=args.tunnel1_rekey_fuzz_percentage,
            tunnel1_rekey_margin_time_seconds=args.tunnel1_rekey_margin_time_seconds,
            tunnel1_replay_window_size=args.tunnel1_replay_window_size,
            tunnel1_startup_action=args.tunnel1_startup_action,
            tunnel2_dpd_timeout_action=args.tunnel2_dpd_timeout_action,
            tunnel2_dpd_timeout_seconds=args.tunnel2_dpd_timeout_seconds,
            tunnel2_ike_versions=args.tunnel2_ike_versions,
            tunnel2_inside_cidr=args.tunnel2_inside_cidr,
            tunnel2_phase1_dh_group_numbers=args.tunnel2_phase1_dh_group_numbers,
            tunnel2_phase1_encryption_algorithms=args.tunnel2_phase1_encryption_algorithms,
            tunnel2_phase1_integrity_algorithms=args.tunnel2_phase1_integrity_algorithms,
            tunnel2_phase1_lifetime_seconds=args.tunnel2_phase1_lifetime_seconds,
            tunnel2_phase2_dh_group_numbers=args.tunnel2_phase2_dh_group_numbers,
            tunnel2_phase2_encryption_algorithms=args.tunnel2_phase2_encryption_algorithms,
            tunnel2_phase2_integrity_algorithms=args.tunnel2_phase2_integrity_algorithms,
            tunnel2_phase2_lifetime_seconds=args.tunnel2_phase2_lifetime_seconds,
            tunnel2_preshared_key=args.tunnel2_preshared_key,
            tunnel2_rekey_fuzz_percentage=args.tunnel2_rekey_fuzz_percentage,
            tunnel2_rekey_margin_time_seconds=args.tunnel2_rekey_margin_time_seconds,
            tunnel2_replay_window_size=args.tunnel2_replay_window_size,
            tunnel2_startup_action=args.tunnel2_startup_action,
            tags=tags
        )
            
        for static_route, index in enumerate(args.static_routes):
            aws.ec2transitgateway.Route(f"{name}-vpnResource-{index}",
                destination_cidr_block=static_route,
                transit_gateway_attachment_id=vpn.transit_gateway_attachment_id,
                transit_gateway_route_table_id=args.association_default_route_table_id,
            )

