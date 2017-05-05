(function() {
	angular.module('config-gui', ['ngRoute', 'ngStorage', 'ngMessages', 'angular.filter'])

	.run(['$rootScope', '$sessionStorage', '$http', '$location', 'AuthService', function($rootScope, $sessionStorage, $http, $location, AuthService) {

		$rootScope.$on('$routeChangeStart', function(event, next, prev) {

			if (next.requireAuth && !AuthService.isUserLoggedIn()) {
				$location.path('/login');
			}
			else if (next.templateUrl == 'templates/pages/login.html' && AuthService.isUserLoggedIn()) {
				event.preventDefault();
				$location.path('/');
			}

		})

		$rootScope.userLoggedIn = $sessionStorage.userLoggedIn;

		// For debugging
		console.log('Root scope: userLoggedIn - ' + $rootScope.userLoggedIn);
		console.log('Session storage: userLoggedIn - ' + $sessionStorage.userLoggedIn);

		$rootScope.error = false;
		$rootScope.errorMessage ="";

	}])

	// Factories

	// Service for checking if authentication is needed
	.factory('AuthService', ['CVPAPIService', '$sessionStorage', '$rootScope', '$location', function(CVPAPIService, $sessionStorage, $rootScope, $location) {

		return {
			isUserLoggedIn: function() {
				if(typeof $sessionStorage.userLoggedIn === 'undefined') {
					CVPAPIService.getAuthInfo()
						.then(
							function success(response) {
								if(!response['data']['errorCode']) {	
									console.log('User already logged in. Redirecting to home page.');
									$sessionStorage.userLoggedIn = true;
									$rootScope.userLoggedIn = true;
									$rootScope.error = false;
									return true;
								}
								else {
									console.log('No user logged in.');
									$sessionStorage.userLoggedIn = false;
									$rootScope.userLoggedIn = true;
									$rootScope.error = false;
									$rootScope.errorMessage ="No user logged in.";
									return false;
								}
							},
							function error(response) {
								console.log('Authentication check failed.');
								console.log(response);
								$rootScope.error = true;
								$rootScope.errorMessage ="Authentication check failed.";
								return false;
							}
						);
				}
				else {
					if($sessionStorage.userLoggedIn) {
						return true;
					}
					else {
						return false;
					}
				}
			}
		};

	}])

	// Service for containers
	.factory('ContainersService', ['CVPAPIService', '$rootScope', function (CVPAPIService) {

		return {
			getContainers: function() {
				var promise = CVPAPIService.searchContainers('', '0', '0');
				promise.then(
						function success(response) {
							console.log('Get Containers Success');
							$rootScope.error = false;
						
							// console.log(response);
						},
						function error(response) {
							console.log('Get Containers Failure');
							$rootScope.error = true;
							$rootScope.errorMessage ="Get Containers Failure";
							console.log(response);
						}
				);
				return promise;
			}
		}

	}])

	// Service acting as wrapper for CVP API calls
	.factory('CVPAPIService',  ['$http', '$rootScope', function($http) {

		var cvpServerIPAddress = '10.10.10.10'
		var baseUrl = 'https://' + cvpServerIPAddress + '/cvpservice';
		var serialize = function(obj) {
			
			var str = [];
			for(var p in obj) {
				str.push(encodeURIComponent(p) + '=' + encodeURIComponent(obj[p]));
			}	
			return str.join('&');
		
		};

		// Configlet - Operations about configlets

		// This api call is used to add a configlet.
		var addConfiglet = function(config, name) {

			return $http.post(baseUrl + '/configlet/addConfiglet.do', {
				'config' : config, 
				'name' : name
			});

		};

		// This api call is used to get the configlets.
		var getConfiglets = function(startIndex, endIndex, type, objectId, objectType) {
			
			if(typeof objectId === undefined) {
				objectId = '';
			}
			
			if(typeof objectId === undefined) {
				objectId = '';
			}

			return $http.get(baseUrl + '/configlet/getConfiglets.do', {
				'params': {
					'startIndex': startIndex,
					'endIndex': endIndex,
					'type': type,
					'objectId': objectId,
					'objectType': objectType
				}
			});

		}

		// This api call is used to get the configlet by its name.
		var getConfigletByName = function(name) {

			return $http.get(baseUrl + '/configlet/getConfigletByName.do', {
				'params': {
					'name' : name
				}
			});

		};

		// This api call is used to update an existing configlet.
		var updateConfiglet = function(config, key, name) {

			return $http.post('https://10.10.10.253/cvpservice/configlet/updateConfiglet.do', {
				'config' : config, 
				'key' : key, 
				'name' : name
			});

		};


		// Login - Login operations

		// This api call is used to log into the CVP application.
		var login = function(username, password) {
			
			return $http.post(baseUrl + '/login/authenticate.do', {
					'userId' : username,
					'password' : password
				});

		};

		// This api call is used to log out from the current session.
		var logout = function() {

			return $http.post(baseUrl + '/login/logout.do');

		};

		// This api call is used to get Base64 of authentication info.
		var getAuthInfo = function() {

			return $http.post(baseUrl + '/login/getAuthInfo.do');

		};


		// Inventory - Operations about Inventory

		// This API endpoint searches the tempcontainers for the given query parameter.
		var searchContainers = function(queryparam, startIndex, endIndex) {

			return $http.get(baseUrl + '/inventory/add/searchContainers.do', {
				'params': { 
					'queryparam': queryparam, 
					'startIndex': startIndex, 
					'endIndex': endIndex
				}
			});

		};


		// Provisioning - ZTP related Operations

		// This api call is used to add temporary proposed actions.
		var addTempAction = function(params, data) {
			
			params = serialize(params);
			return $http.post(baseUrl + '/provisioning/addTempAction.do?' + params , {
				'data' : data
			});
		
		};

		// This api call is used to get all temporary actions.
		var getAllTempActions = function(startIndex, endIndex) {

			return $http.get(baseUrl + '/provisioning/getAllTempActions.do', {
				'params': {
					'startIndex': startIndex,
					'endIndex': endIndex
				}
			});

		}

		// This api call is used to save the changes made in ztp.
		var saveTopology = function(body) {

			return $http.post(baseUrl + '/provisioning/v2/saveTopology.do', body);

		};

		// This api call is a proxy service that is used to get the parent Ids for Topology in the CVP system.
		var getContainerInfoById = function(containerId) {

			return $http.get(baseUrl + '/provisioning/getContainerInfoById.do', {
				'params': {
					'containerId': containerId
				}
			});

		}

		// This api call is used to get list of netelements under a given container.
		var getAllNetElementListByContainer = function(nodeId, queryParam, ignoreAdd, startIndex, endIndex) {
			
			console.log(nodeId);
			return $http.get(baseUrl + '/provisioning/getAllNetElementListByContainer.do', {
				'params': { 
					'nodeId': nodeId, 
					'queryParam': queryParam, 
					'ignoreAdd': ignoreAdd,
					'startIndex': startIndex,
					'endIndex': endIndex
				}
			});

		}

		// This api call is a proxy service that is used to get all temp configs by container id from the CVP system.
		var getTempConfigsByContainerId = function(containerId) {
			
			return $http.get(baseUrl + '/provisioning/getTempConfigsByContainerId.do', {
				'params': {
					'containerId': containerId
				}
			});

		};


		// Wrapper functions for specific functions	
		
		// This wrapper function is used to add a container.
		var addContainer = function(name, parentContainerId, parentContainerName) {
			
			var params = {
				'format': 'topology',
				'queryParam': '',
				'nodeId': 'root'
			};
			var data = [{
				'action': 'add',
				'fromId': '',
				'fromName': '',
				'info': 'Container ' + name + ' created', 
				'infoPreview': 'Container ' + name + ' created', 
				'nodeId': name,
				'nodeName': name,
				'nodeType': 'container',
				'toId': parentContainerId,
				'toIdType': 'container',
				'toName': parentContainerName
			}];
			return addTempAction(params, data);

		};

		// This wrapper function is used to assign configlets to a container.
		var assignConfigletToContainer = function(configletList, configletNamesList, containerId, containerName) {
			
			var params = {
				'format': 'topology',
				'queryParam': '',
				'nodeId': 'root'
			};
			var data = [{
				'action': 'associate',
				'configletBuilderList': [],
				'configletBuilderNamesList': [],
				'configletList': configletList,
				'configletNamesList': configletNamesList,
				'fromId' : '',
				'fromName': '',
				'ignoreConfigletBuilderList': [],
				'ignoreConfigletBuilderNamesList': [],
				'ignoreConfigletList': [],
				'ignoreConfigletNamesList': [],
				'info': 'Configlet Assign: to container' + containerName,
				'infoPreview': '<b>Configlet Assign:</b> to container ' + containerName,
				'nodeId': '',
				'nodeName': '',
				'nodeType': 'configlet',
				'toId': containerId,
				'toIdType': 'container',
				'toName': containerName
			}];
			return addTempAction(params, data);

		};

		// This wrapper function is used to save configlets to CVP.
		var saveConfiglet = function(config, name) {

			getConfigletByName(name)
				.then(
					function success(response) {
						if(response['data']['errorCode']) {
							console.log(config)
							console.log(name)
							addConfiglet(config, name)
								.then(
									function success(response) {
										console.log('Push success.');
										console.log(response);
										$rootScope.error = false;
										
									},
									function error(response) {
										console.log('Push failed.');
										$rootScope.error = true;
										$rootScope.errorMessage ="Configuration Push Failed.";
										console.log(response);
									}
								);
						}
						else if(response['data']['key']) {
							var key = response['data']['key'];
							updateConfiglet(config, key, name)
								.then(
									function success(response) {
										console.log('Push success.');
										$rootScope.error = false;
										
										console.log(response);
									},
									function error(response) {
										console.log('Push failed.');
										$rootScope.error = true;
										$rootScope.errorMessage ="Configuration Push Failed.";
										console.log(response);
									}
								);
						}
					},
					function error(response) {
						console.log('Push failed.');
						$rootScope.error = true;
						$rootScope.errorMessage ="Configuration Push Failed.";
						console.log(response);
					}
				);

		};

		// This wrapper function is used to get the container ID from the container name.
		var getContainerId = function(containerName) {

			return searchContainers(containerName, '0', '0');

		};

		var service = {
			'addConfiglet': addConfiglet,
			'getConfiglets': getConfiglets,
			'getConfigletByName': getConfigletByName,
			'updateConfiglet': updateConfiglet,
			'login': login,
			'logout': logout,
			'getAuthInfo': getAuthInfo,
			'searchContainers': searchContainers,
			'addTempAction': addTempAction,
			'getAllTempActions': getAllTempActions,   
			'saveTopology': saveTopology,
			'getContainerInfoById': getContainerInfoById,
			'getAllNetElementListByContainer': getAllNetElementListByContainer,
			'getTempConfigsByContainerId': getTempConfigsByContainerId,
			'addContainer': addContainer,
			'assignConfigletToContainer': assignConfigletToContainer,
			'saveConfiglet': saveConfiglet,
			'getContainerId': getContainerId
		};

		return service;

	}])

	// Service for logging out the user
	.factory('LogoutService', ['CVPAPIService', '$sessionStorage', '$rootScope', '$location', function(CVPAPIService, $sessionStorage, $rootScope, $location){
	 	
		CVPAPIService.logout()
			.then(
				function success(response) {
					console.log('Logout success. Redirecting to login page.');
					console.log(response);
					$sessionStorage.userLoggedIn = false;
					$rootScope.userLoggedIn = false;
					$location.url('/login');			
					console.log('Root scope: userLoggedIn - ' + $rootScope.userLoggedIn);
					console.log('Session storage: userLoggedIn - ' + $sessionStorage.userLoggedIn);
					$rootScope.error = false;
										
				},
				function error(response) {
					console.log('Logout failed.');
					console.log(response);
					$rootScope.error = true;
					$rootScope.errorMessage ="Logout failed.";
				}
			);

	 }])

	// Controllers

	// Controller for the login page
	.controller('LoginController', ['CVPAPIService', '$sessionStorage', '$rootScope', '$location', function(CVPAPIService, $sessionStorage, $rootScope, $location) {
		
		this.username = '';
		this.password = '';

		this.login = function(form) {
			CVPAPIService.login(this.username, this.password)
				.then(
					function success(response) {
						if(response['data']['sessionId']) {
							console.log('Authentication success. Redirecting to home page.');
							console.log(response);
							$sessionStorage.userLoggedIn = true;
							$rootScope.userLoggedIn = true;
							console.log('Root scope: userLoggedIn - ' + $rootScope.userLoggedIn);
							console.log('Session storage: userLoggedIn - ' + $sessionStorage.userLoggedIn);
							form.$error.invalidCredentials = false;
							$location.url('/');
							$rootScope.error = false;
										
						}
						else {
							console.log('Authentication failed');
							console.log(response);
							$rootScope.error = true;
							$rootScope.errorMessage ="Authentication Failed.";
							form.$error.invalidCredentials = true;
						}
					},
					function error(response) {
						console.log('Authentication failed');
						$rootScope.error = true;
						$rootScope.errorMessage ="Authentication Failed.";
						console.log(response);
					}
				);
		
		};

	}])


	// Controller for the Containers page
	.controller('ContainerController', ['containers', '$rootScope', 'CVPAPIService', '$route', '$location', function(containers, CVPAPIService, $route, $location)  {

		this.containers = [];

		for(key in containers['data']['data']) {
			(function(containersList, key, containers) {

				CVPAPIService.getContainerInfoById(containers[key]['key'])
				.then(
					function success(response) {
						containersList.push({
							'name': containers[key]['name'],
							'key': containers[key]['key'],
							'deviceCount': response['data']['associatedSwitches']
						});
						$rootScope.error = false;
					},
					function error(response) {
					  	console.log('getContainerInfoById API call failed.')
					}
				);

			})(this.containers, key, containers['data']['data']);
		}
		


		this.toggle = false;

		// Toggles the Add Container menu
		this.toggleMenu = function() {
			this.toggle = !this.toggle;
		};

		this.name = '';
		this.deviceCount = 0;

		// Adds the container into CVP
		this.addContainer = function(form, name) {
			
			CVPAPIService.searchContainers(name, '0', '0')
				.then(
					function success(response) {
						console.log('Search containers success');
						console.log(response);
						if(response['data']['total'] == 0) {

							form.name.$error.containerAlreadyExists = false;
							CVPAPIService.addContainer(name, 'root', 'Tenant')
								.then(
									function success(response) {
										console.log('Add container success');
										console.log(response);
										CVPAPIService.saveTopology([])
											.then(
												function success(response) {
													console.log('Save topology success');
													console.log(response);
													$route.reload();
													$rootScope.error = false;
												},
												function error(response) {
													console.log('Save topology failed');
													console.log(response);
													$rootScope.error = true;
													$rootScope.errorMessage ="Save Topology Failed.";
												}
											);
									},
									function error(response) {
										console.log('Add container failed');
										$rootScope.error = true;
										$rootScope.errorMessage ="Add Container Failed.";
										console.log(response);
									}
								);
						}
						else {
							console.log('Container with that name already exists');
							form.name.$error.containerAlreadyExists = true;
						}
					},
					function error(response) {
						console.log('Search containers failed');
						console.log(response);
						$rootScope.error = true;
						$rootScope.errorMessage ="Search Containers Failed.";
					}
				);

		};

		this.redirect = function(name) {
			$location.path('/containers/' + name);
		}
		

	}])

	// Controller for the Devices page
	.controller('DeviceController', ['$location', '$rootScope', function($location) {
		
		this.devices = devices;
		
		this.toggle = false;

		// Toggles the Add Device menu
		this.toggleMenu = function() {
			this.toggle = !this.toggle;
		};

		this.name = '';
		this.serialNo = '';
		this.container='Undefined';

		// Adds the device into the app
		this.addDevice = function() {
			
			console.log('Device added');
			devices.push({
				'name': this.name,
				'serialNo': this.serialNo,
				'container': this.container	
			});

			for (i = 0; i < containers.length; ++i) {
				if(this.container === containers[i].name) {
					containers[i].deviceCount++;
				}
			};

		};

		this.redirect = function(serialNo) {
			$location.path('/devices/' + serialNo);
		}

	}])

	

	// Controller for the Config page for devices
	.controller('DeviceConfigController', ['CVPAPIService', '$rootScope', '$routeParams', function(CVPAPIService, $routeParams) {
		
		this.serialNo = $routeParams.name;

		this.tab = "routing";
		this.subTab = "ospf";


		this.defaultTabs = {
			"routing" : "ospf",
			"interface" : "ethernet"
		}


		this.getNumber = function(num) {
			numArr=[];
			for(i=1; i<=num;++i)
			{
				numArr.push(i);
			}
			// console.log(numArr);
			return numArr;
		}

		this.setTab = function(value) {
			this.tab = value;
				 this.subTab = this.defaultTabs[this.tab];
		};

		this.setSubTab = function(value) {
			this.subTab = value;
		};

		this.pushConfig = function(configName) {
			
			switch(configName) {
				case 'hostname':
					this.pushHostname();
					break;
				case 'ospf':
					this.pushOSPF();
					break;
				case 'bgp':
					this.pushBGP();
					break;
				case 'vxlan':
					this.pushVxLAN();
					break; 

			} 

		}

		// Hostname

		this.hostname = '';

		this.pushHostname = function() {
			
			CVPAPIService.saveConfiglet(this.hostname, $routeParams.name + '-hostname')

		};

		// OSPF

		this.ospfInstance = '';
		this.ospfRouterId = '';
		this.ospfNumNetworks = '';
		this.ospfNetwork = [];
		this.ospfRFC = '';
		this.ospfRedistributeConnected = '';
		this.ospfRedistributeStatic = '';
		this.ospfRedistributeISIS = '';
		this.ospfRedistributeBGP = '';
		this.ospfRedistributeRIP = '';
		this.ospfShut = '';

		this.pushOSPF = function() {
			
			config = '';
			config = config + 'router ospf ' + this.ospfInstance + '\n';
			if(this.ospfShut) {
				config = config + 'shutdown\n';
			}
			if(this.ospfRouterId) {
				config = config + 'router-id ' + this.ospfRouterId + '\n';
			}
			var area = []
			for(i in this.ospfNetwork) {
				config = config + 'network ' + this.ospfNetwork[i]['network'] + '/' + this.ospfNetwork[i]['mask'] + ' area ' + this.ospfNetwork[i]['area']['id'] + '\n';
				if(!(this.ospfNetwork[i]['area']['id'] in area)) {
					var temp = {}
					temp[this.ospfNetwork[i]['area']['id']] = this.ospfNetwork[i]['area']['type'];
					area.push(temp);
				}
			}
			for(i in area) {
				for(j in area[i]) {
					if(area[i][j] === 'stub') {
						config = config + 'area ' + j + ' stub\n';
					}
					else if(area[i][j] === 'totallyStub') {
						config = config + 'area ' + j + ' stub no-summary\n';
					}
					else if(area[i][j] === 'nssa') {
						config = config + 'area ' + j + ' nssa\n';
					}
					else if(area[i][j] === 'totallyNssa') {
						config = config + 'area ' + j + ' nssa no-summary\n';
					}
				}
			}
			if(this.ospfRFC === '1583') {
				config = config + 'compatible rfc1583\n';
			}
			if(this.ospfRedistributeConnected) {
				config = config + 'redistribute connected\n';
			}
			if(this.ospfRedistributeStatic) {
				config = config + 'redistribute static\n';
			}
			if(this.ospfRedistributeISIS) {
				config = config + 'redistribute isis\n';
			}
			if(this.ospfRedistributeBGP) {
				config = config + 'redistribute bgp\n';
			}
			if(this.ospfRedistributeRIP) {
				config = config + 'redistribute rip\n';
			}

			console.log(config);
			CVPAPIService.saveConfiglet(config, $routeParams.name + '-ospf')

		}


		// BGP

		this.bgpInstance = '';
		this.bgpRouterId = '';
		this.bgpNumNetworks = '';
		this.bgpNetwork = [];
		this.bgpRedistributeConnected = '';
		this.bgpRedistributeStatic = '';
		this.bgpRedistributeOSPF = '';
		this.bgpRedistributeISIS = '';
		this.bgpRedistributeRIP = '';
		this.bgpNeighbor = [];
		this.bgpShut = '';

		this.pushBGP = function() {
			config = '';
			config = config + 'router bgp ' + this.bgpInstance + '\n';
			if(this.bgpShut) {
				config = config + 'shutdown\n';
			}
			if(this.bgpRouterId) {
				config = config + 'router-id ' + this.bgpRouterId + '\n';
			}
			for(i in this.bgpNeighbor) {
				neighborConfig = 'neighbor ' + this.bgpNeighbor[i]['neighbor'] + ' ';
				config = config + neighborConfig + 'remote-as ' + this.bgpNeighbor[i]['remoteAS'] + '\n';
				if(this.bgpNeighbor[i]['nextHopSelf']) {
					config = config + neighborConfig + 'next-hop-self\n';
				}
				if(this.bgpNeighbor[i]['updateSource']) {
					config = config + neighborConfig + 'update-source ' + this.bgpNeighbor[i]['updateSourceInterface'] + '\n';
				}
				if(this.bgpNeighbor[i]['ebgpMultihop']) {
					config = config + neighborConfig + 'ebgp-multihop ' + this.bgpNeighbor[i]['ebgpHopCount'] + '\n';
				}
				if(this.bgpNeighbor[i]['routeMap']) {
					config = config + neighborConfig + 'route-map ' + this.bgpNeighbor[i]['routeMapName'] + ' ' + this.bgpNeighbor[i]['routeMapDirection'] + '\n';
				}
			}
			for(i in this.bgpNetwork) {
				config = config + 'network ' + this.bgpNetwork[i]['network'] + '/' + this.bgpNetwork[i]['mask'] + ' route-map ' + this.bgpNetwork[i]['routemap'] + '\n';
			}
			if(this.bgpRedistributeConnected) {
				config = config + 'redistribute connected\n';
			}
			if(this.bgpRedistributeStatic) {
				config = config + 'redistribute static\n';
			}
			if(this.bgpRedistributeISIS) {
				config = config + 'redistribute isis\n';
			}
			if(this.bgpRedistributeOSPF) {
				config = config + 'redistribute ospf\n';
			}
			if(this.bgpRedistributeRIP) {
				config = config + 'redistribute rip\n';
			}

			console.log(config);
			CVPAPIService.saveConfiglet(config, $routeParams.name + '-bgp')

		}

		//VxLAN

		this.vxlanLoopback = null;
		this.vxlanRouterId = '';
		this.vxlanUdpPort = 4789;
		this.vxlanNumMappings = null;
		this.vxlanMapping = [];
		this.vxlanVLANFloodListCheck = false;
		this.vxlanFloodListCheck = false;
		this.vxlanNumVTEP = null;
		this.vxlanFloodList = [];
		this.vxlanNumVLANFloodList = null;
		this.vxlanVLANFloodList = [];

		this.pushVxLAN = function() {
			config = 'interface vxlan1\n';
			config = config + 'vxlan source-interface loopback ' + this.vxlanLoopback + '\n';
			config = config + 'vxlan udp-port ' + this.vxlanUdpPort + '\n';
			for(i in this.vxlanMapping) {
				config = config + 'vxlan vlan ' + this.vxlanMapping[i]['vlan'] + ' vni ' + this.vxlanMapping[i]['vni'] + '\n';
			}
			if(this.vxlanFloodListCheck) {
				config = config + 'vxlan flood vtep ' + Array.prototype.join.call(this.vxlanFloodList, ' ') + '\n';
				console.log(this.vxlanFloodList);
			}
			if(this.vxlanVLANFloodListCheck) {
				for(var i in this.vxlanVLANFloodList) {
					temp = '';
					for (var j in this.vxlanVLANFloodList[i]['floodlist']) {
       					temp = temp + this.vxlanVLANFloodList[i]['floodlist'][j] + ' ';
    				}
					config = config + 'vxlan ' + this.vxlanVLANFloodList[i]['vlan'] + ' flood vtep ' + temp + '\n';
				}
			}

			console.log(config);
			CVPAPIService.saveConfiglet(config, $routeParams.name + '-vxlan')

		}

		//Interfaces
		this.interfaceEthernetSwitchport=true;

		this.interfacePortChannelNum=null;
		this.interfacePortChanneSwitchport=true;

	}])

	// Controller for the Config page for controllers
	.controller('ContainerConfigController', ['CVPAPIService', '$rootScope', '$routeParams', '$location', function(CVPAPIService, $routeParams, $location) {
		
		this.name = $routeParams.name;
		var id = null;
		CVPAPIService.getContainerId(this.name)
			.then(
				function success(response) {
					id = response['data']['data'][0]['key'];
					$rootScope.error = false;
				},
				function error(response) {
					console.log('GetContainer failed.');
					console.log(response);
					$rootScope.error = true;
					$rootScope.errorMessage ="Get Containers Failed.";
				}
			);

		this.defaultTabs = {
			'banner' : 'login',
			'admin' : 'username'
		}

		this.tab = 'banner';
		this.subTab = 'login';

		this.setTab = function(value) {
			this.tab = value;
			this.subTab = this.defaultTabs[this.tab];
		};

		this.setSubTab = function(value) {
			this.subTab = value;
		};

		this.getNumber = function(num) {
			numArr=[];
			for(i=1; i<=num;++i)
			{
				numArr.push(i);
			}
			// console.log(numArr);
			return numArr;
		};


		this.loginBanner = '';
		this.motdBanner = '';

		this.pushConfig = function() {

			var name = this.name;

			CVPAPIService.getConfiglets('0', '0', 'ignoreDraft', id, 'container')
				.then(
					function success(response) {
						console.log('GetConfiglets success');
						configletList = [];
						configletNamesList = [];
						for(var configlet in response['data']['data']) {
							if(response['data']['data'][configlet]['name'].indexOf(name) > -1) {
								configletList.push(response['data']['data'][configlet]['key']);
								configletNamesList.push(response['data']['data'][configlet]['name']);
							}
						}
						CVPAPIService.assignConfigletToContainer(configletList, configletNamesList, id, name)
							.then(
								function success(response) {
									console.log('AssignConfigletToContainer success');
									CVPAPIService.saveTopology([])
										.then(
											function success(response) {
												console.log('Save topology success');
											},
											function error(response) {
												console.log('Save topology failed');
												console.log(response);
											}
										);
										$rootScope.error = false;
								},
								function error(response) {
									console.log('AssignConfigletToContainer failed');
									console.log(response);
									$rootScope.error = true;
									$rootScope.errorMessage ="Assigning Configlet To Container Failed";
								}
							);
					},
					function error(response) {
						console.log('GetConfiglets failed');
						console.log(response);
						$rootScope.error = true;
						$rootScope.errorMessage ="Get Configlets Failed.";
					}
				);

		}

		this.saveConfig = function(configName) {
			
			name = $routeParams.name;
			switch(configName) {
				case 'loginBanner':
					if(this.loginBanner) {
						config = 'banner login\n' + this.loginBanner + "\nEOF";
						name = name + '-login-banner';
					}
					break;
				case 'motdBanner':
					if(this.motdBanner) {
						config = 'banner motd\n' + this.motdBanner + "\nEOF";
						name = name + '-motd-banner';
					}
					break; 
			}
			CVPAPIService.getConfigletByName(name)
				.then(
					function success(response) {
						if(response['data']['errorCode']) {
							console.log(config)
							console.log(name)
							CVPAPIService.addConfiglet(config, name)
								.then(
									function success(response) {
										console.log('Push success.');
										console.log(response);
										$rootScope.error = false;
									},
									function error(response) {
										console.log('Push failed.');
										console.log(response);
										$rootScope.error = true;
										$rootScope.errorMessage ="Configlet Push Failed.";
									}
								);
						}
						else if(response['data']['key']) {
							var key = response['data']['key'];
							CVPAPIService.updateConfiglet(config, key, name)
								.then(
									function success(response) {
										console.log('Push success.');
										console.log(response);
										$rootScope.error = false;
									},
									function error(response) {
										console.log('Push failed.');
										console.log(response);
										$rootScope.error = true;
										$rootScope.errorMessage ="Configlet Push Failed.";
									}
								);
						}
					},
					function error(response) {
						console.log('Push failed.');
						console.log(response);
						$rootScope.error = true;
						$rootScope.errorMessage ="Configlet Push Failed.";
					}
				);
		};

		this.usernameNum=null;

	}])

		
	var devices = [{
		name:'do450',
		serialNo:'JPE15483153',
		container: 'Undefined'
	},
	{
		name:'do420',
		serialNo:'JPE15483155',
		container:'Tenant'
	}];


	// var containers = [{
	// 	name:'Undefined',
	// 	deviceCount:1
	// },
	// {
	// 	name:'Tenant',
	// 	deviceCount:1
	// }];

		
})();




