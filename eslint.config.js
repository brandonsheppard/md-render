export default [
	{
		ignores: [ 'coverage/**', 'node_modules/**' ]
	},
	{
		files: [ '**/*.js' ],
		languageOptions: {
			ecmaVersion: 2022,
			sourceType: 'module'
		},
		rules: {
			'indent': [ 'error', 'tab' ],
			'linebreak-style': [ 'error', 'unix' ],
			'quotes': [ 'error', 'single' ],
			'semi': [ 'error', 'always' ],
			'prefer-const': 'error',
			'no-unused-vars': [ 'error', { argsIgnorePattern: '^_' } ],
			'camelcase': [ 'error', {
				properties: 'always'
			} ],
			'func-style': [ 'error', 'declaration' ],
			'array-bracket-spacing': [ 'error', 'always' ],
			'comma-dangle': [ 'error', 'never' ],
			'brace-style': [ 'error', '1tbs' ],
			'space-before-function-paren': [ 'error', 'always' ],
			'space-before-blocks': [ 'error', 'always' ],
			'template-curly-spacing': [ 'error', 'always' ],
			'space-in-parens': [ 'error', 'never' ]
		}
	}
];
