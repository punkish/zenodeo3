module.exports = {
	apps : [{
    		name   : "z3",
    		script : "./server.js",
    		env_production: {
			NODE_ENV: "production"
   		},
		env_test: {
			NODE_ENV: "test"
		},
		env_development: {
			NODE_ENV: "development"
		},
		env_cron: {
			NODE_ENV: "cron"
		},
		instance_var: "INSTANCE_ID"
  	}]
}
