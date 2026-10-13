@IsTest
private class BankingIntegrationServiceTest {

    private class StubResponse implements HttpCalloutMock {
        private Integer status;
        private String body;
        StubResponse(Integer status, String body) { this.status = status; this.body = body; }
        public HttpResponse respond(HttpRequest req) {
            HttpResponse res = new HttpResponse();
            res.setStatusCode(status);
            res.setHeader('Content-Type', 'application/json');
            res.setBody(body);
            return res;
        }
    }

    private class Unreachable implements HttpCalloutMock {
        public HttpResponse respond(HttpRequest req) {
            throw new System.CalloutException('Read timed out');
        }
    }

    @IsTest
    static void getOperationReturnsBody() {
        Test.setMock(HttpCalloutMock.class, new StubResponse(200, '{"score":742}'));
        Test.startTest();
        BankingIntegrationService.ApiResult r = BankingIntegrationService.callBankApi('creditProfile', null);
        Test.stopTest();
        Assert.isTrue(r.ok, 'A 2xx response is ok');
        Assert.areEqual(200, r.status);
        Assert.areEqual('{"score":742}', r.body);
        Assert.isNotNull(r.elapsedMs);
    }

    @IsTest
    static void postOperationSendsPayload() {
        Test.setMock(HttpCalloutMock.class, new StubResponse(201, '{"reference":"WR-305118"}'));
        Test.startTest();
        BankingIntegrationService.ApiResult r = BankingIntegrationService.callBankApi('sendWire', '{"quoteId":"FXQ-88213"}');
        Test.stopTest();
        Assert.isTrue(r.ok);
        Assert.areEqual(201, r.status);
        Assert.isTrue(r.body.contains('WR-305118'));
    }

    @IsTest
    static void serverErrorIsNotOk() {
        Test.setMock(HttpCalloutMock.class, new StubResponse(503, 'down'));
        Test.startTest();
        BankingIntegrationService.ApiResult r = BankingIntegrationService.callBankApi('fxRates', null);
        Test.stopTest();
        Assert.isFalse(r.ok);
        Assert.areEqual('HTTP 503', r.message);
    }

    @IsTest
    static void calloutExceptionIsCaught() {
        Test.setMock(HttpCalloutMock.class, new Unreachable());
        Test.startTest();
        BankingIntegrationService.ApiResult r = BankingIntegrationService.callBankApi('offers', null);
        Test.stopTest();
        Assert.isFalse(r.ok, 'Timeouts never surface as exceptions to the UI');
        Assert.areEqual('Read timed out', r.message);
    }

    @IsTest
    static void unknownOperationIsRejected() {
        BankingIntegrationService.ApiResult r = BankingIntegrationService.callBankApi('deleteEverything', null);
        Assert.isFalse(r.ok);
        Assert.areEqual('Unknown operation', r.message);
        Assert.isNull(r.status, 'No callout is made for an unlisted operation');
    }

    @IsTest
    static void everyListedOperationHasMethodAndPath() {
        for (String key : BankingIntegrationService.OPERATIONS.keySet()) {
            List<String> op = BankingIntegrationService.OPERATIONS.get(key);
            Assert.areEqual(2, op.size(), key);
            Assert.isTrue(op[0] == 'GET' || op[0] == 'POST', key + ' method');
            Assert.isTrue(op[1].startsWith('/'), key + ' path');
        }
    }
}
