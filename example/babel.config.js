module.exports = function (api) {
	api.cache(true);
	return {
		presets: ['babel-preset-expo'],
		plugins: [
			// Only if you're using TypeScript paths
			['module-resolver', { extensions: ['.js', '.jsx', '.ts', '.tsx'] }],
		],
	};
};
