const {
  FindingType,
  FindingSeverity,
  Finding,
  createTransactionEvent,
  getProvider,
  getAlerts
} = require("@fortanetwork/forta-bot");
const {
  handleTransaction,
  initialize,
  UPGRADE_EVENT
} = require("./bot");
let config =  require("../proxy-addresses.json");
const contract = 'AAVE';
const address = '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9';
const newImplementation = '0xc13eac3b4f9eed480045113b7af00f7b5655ece8';


describe("contract upgraded bot", () => {

  const mockTxEvent = { filterLog: jest.fn() };

  const upgradedEvent = {
    address: '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9',
    args: [
      newImplementation,
    ],
  };
  beforeEach(() => {
    mockTxEvent.filterLog.mockReset();
  });


  describe("handleTransaction", () => {
    it('returns empty findings there are no Upgraded events', async () => {

      mockTxEvent.filterLog.mockReturnValueOnce([]);
      const findings = await handleTransaction(mockTxEvent);

      expect(findings).toStrictEqual([]);
    });
    it('returns a finding if there is a Upgraded event', async () => {

      mockTxEvent.filterLog.mockReturnValueOnce([upgradedEvent]);
      let rpcUrl = "https://cloudflare-eth.com/";
      const provider = await getProvider({ rpcUrl });
      const findings = await handleTransaction(mockTxEvent, provider);

      expect(findings).toStrictEqual([
        Finding.fromObject({
          name: 'Implementation upgraded',
          description: `Implementation upgraded for ${contract}`,
          alertId: 'CONTRACT UPGRADED',
          protocol: `${contract}`,
          severity: FindingSeverity.High,
          type: FindingType.Info,
          metadata: {
            address,
            newImplementation,
            newByteCodeHash:"0x9279d46db09d8ccbcd2cd6bbb280d068c93cd37aee485a3c3891443aad12b743",
            extraInfo:"{}"
          },
        }),
      ]);
    });
    const mockTxEvent = createTransactionEvent(
      { hash: "0x1234" },
      {},
      1,
      [],
      []
    );
    mockTxEvent.filterLog = jest.fn();

    beforeEach(() => {
      mockTxEvent.filterLog.mockReset();
    });


  });
});
