/**
 * Thin, allow-listed gateway from the Banking Hub LWCs to the bank's systems.
 * Today the Named Credential points at the Postman mock; swap its endpoint to the
 * bank's sandbox and nothing here changes.
 *
 * Never throws to the UI: a failed callout returns ok=false so every component can
 * fall back to its built-in demo data without an error on stage.
 */
public with sharing class BankingIntegrationService {

    @TestVisible private static final String NAMED_CREDENTIAL = 'BankingHubMock';
    private static final Integer TIMEOUT_MS = 5000;

    // Demo identities. Production would take these from the Contact / Account.
    private static final String CUSTOMER_ID = 'CUST-104882';

    // operation -> { method, path }. The LWC can only reach what is listed here.
    @TestVisible private static final Map<String, List<String>> OPERATIONS = new Map<String, List<String>>{
        'creditProfile'      => new List<String>{ 'GET',  '/customers/' + CUSTOMER_ID + '/credit-profile' },
        'offers'             => new List<String>{ 'GET',  '/customers/' + CUSTOMER_ID + '/offers' },
        'verifyIdentity'     => new List<String>{ 'POST', '/identity/verify' },
        'openAccount'        => new List<String>{ 'POST', '/accounts/applications' },
        'loanRates'          => new List<String>{ 'GET',  '/loans/rates?type=auto' },
        'prequalify'         => new List<String>{ 'POST', '/loans/prequalify' },
        'verifyBusiness'     => new List<String>{ 'POST', '/kyb/verify' },
        'submitBusiness'     => new List<String>{ 'POST', '/business-applications' },
        'testSftp'           => new List<String>{ 'POST', '/payment-channels/sftp/test' },
        'provisionWire'      => new List<String>{ 'POST', '/payment-channels/wire' },
        'fxRates'            => new List<String>{ 'GET',  '/fx/rates?base=USD' },
        'fxQuote'            => new List<String>{ 'POST', '/fx/quotes' },
        'sendWire'           => new List<String>{ 'POST', '/wires' }
    };

    public class ApiResult {
        @AuraEnabled public Boolean ok;
        @AuraEnabled public Integer status;
        @AuraEnabled public String body;
        @AuraEnabled public Long elapsedMs;
        @AuraEnabled public String message;
    }

    /**
     * @param operation  one of the OPERATIONS keys
     * @param payload    JSON body for POST operations; ignored for GET
     */
    @AuraEnabled
    public static ApiResult callBankApi(String operation, String payload) {
        ApiResult result = new ApiResult();
        result.ok = false;

        List<String> op = OPERATIONS.get(operation);
        if (op == null) {
            result.message = 'Unknown operation';
            return result;
        }

        HttpRequest req = new HttpRequest();
        req.setMethod(op[0]);
        req.setEndpoint('callout:' + NAMED_CREDENTIAL + op[1]);
        req.setTimeout(TIMEOUT_MS);
        req.setHeader('Accept', 'application/json');
        if (op[0] == 'POST') {
            req.setHeader('Content-Type', 'application/json');
            req.setBody(String.isBlank(payload) ? '{}' : payload);
        }

        Long started = System.currentTimeMillis();
        try {
            HttpResponse res = new Http().send(req);
            result.status = res.getStatusCode();
            result.body = res.getBody();
            result.ok = result.status >= 200 && result.status < 300;
            if (!result.ok) {
                result.message = 'HTTP ' + result.status;
            }
        } catch (System.CalloutException e) {
            result.message = e.getMessage();
            System.debug(LoggingLevel.WARN, 'BankingIntegrationService ' + operation + ': ' + e.getMessage());
        }
        result.elapsedMs = System.currentTimeMillis() - started;
        return result;
    }
}
