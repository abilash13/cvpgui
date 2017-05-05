(function() {
	angular.module('config-gui', ['ngRoute'])
	 .controller('hostnameController', function($http) {
	 	this.hostname = "";

		this.pushHostname = function() {
			console.log(data);
		$http.post("https://10.85.128.248/cvpservice/configlet/addConfiglet.do", {'config' : this.hostname, 'name' : 'test4'}).then(function(data) {
				console.log("Push success");
				console.log(data);
			})
			}
			})

	 	.factory('LogoutService',function($http,$location){
	 		$http.post("https://10.85.128.248/cvpservice/login/logout.do")
	 			.then(function(data){
	 				console.log("Logout success");
	 				console.log(data);
	 			});

	 		$location.url('/login');
	 	})

		.controller('LoginController', function($http,$location) {
		this.username = "";
		this.password="";

		this.login_function = function(){
				$http.post("https://10.85.128.248/cvpservice/login/authenticate.do", {
					"userId" : this.username,
					"password" : this.password
					})
				.then(function(data) {
					console.log("Authentication success");
					console.log(data);
					$location.url('/');
			})
			
		};
	})

		// 

		// 
		.controller('AddDeviceController', function($http) {
	 	this.device_name = "";
	 	this.serial_number = "";
	 	this.add="";

		this.addDevice = function() {
				console.log("Device added");
				console.log(this.device_name);
				console.log(this.serial_number);
			}
		this.menu=function(){
			this.add=1;
		}
			
		})
		
			

		// 
		
})();




