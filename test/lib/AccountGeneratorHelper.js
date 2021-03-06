(function() {

    /**
     *
     * @param {AccountGenerator} accountGenerator
     * @param {string} dbName
     * @constructor
     */
    function AccountGeneratorHelper(accountGenerator, dbName) {
        if (!accountGenerator) throw new Error('No accountGenerator specified');
        if (!dbName) throw new Error('No dbname specified');
        this.accountGenerator = accountGenerator;
        this.dbName = dbName;
    }

    /**
     * @param {object} suite
     * @param {string} scenario
     * @param {int} [count]
     * @param {boolean} [modified]
     */
    AccountGeneratorHelper.prototype.registerHooks = function(suite, scenario, count, modified) {

        if (!count) count = 1;

        var self = this;

        suite.beforeEach(function(done) {

            var test = this;

            test.accounts = [];

            self.accountGenerator
                .connect()
                .then(function(client) {

                    return self.accountGenerator.getAndLock({
                        dbName: self.dbName,
                        scenario: 'platform_messages',
                        accountCount: count.toString()
                    });

                })
                .then(function(accounts) {

                    /** @type {IAccount[]} */
                    test.accounts = accounts;

                    console.info('Accounts acquired', test.accounts.map(function(account) {
                        return account.mainPhoneNumber + ':' + account.password;
                    }).join(', '));

                    done();

                })
                .catch(done);

        });

        suite.afterEach(function(done) {

            var test = this;

            if (test.accounts.length == 0) {
                console.info('Nothing to release');
                return done();
            }

            self.accountGenerator
                .release({
                    dbName: self.dbName,
                    rcUserIds: test.accounts.map(function(account) {
                        return account.userId;
                    }),
                    modified: modified ? 'true' : 'false'
                })
                .then(function(result) {
                    console.info('Accounts released');
                    done();
                })
                .catch(done);

        });

    };

    module.exports = AccountGeneratorHelper;

})();