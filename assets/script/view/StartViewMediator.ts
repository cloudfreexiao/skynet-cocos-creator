// import GameProxy from "../model/GameProxy";
import WSProxy from "../model/WSProxy"
import HttpProxy from "../model/HttpProxy"

export default class StartViewMediator extends puremvc.Mediator implements puremvc.IMediator {
    public static NAME: string = "StartViewMediator";

    public constructor(viewComponent: any) {
        super(StartViewMediator.NAME, viewComponent);
    }

    public listNotificationInterests(): string[] {
        return [];
    }

    public handleNotification(notification: puremvc.INotification): void {
        const data = notification.getBody();
        switch (notification.getName()) {

        }
    }

    public onRegister(): void {
        this.viewComponent.testButton.node.on('click', (event) => {
            const wsProxy: WSProxy = <WSProxy>this.facade.retrieveProxy(WSProxy.NAME);
            wsProxy.wsTest();

            // const httpProxy: HttpProxy = <HttpProxy>this.facade.retrieveProxy(HttpProxy.NAME);
            // httpProxy.TestLogin();

            // const gameProxy: GameProxy = <GameProxy>this.facade.retrieveProxy(GameProxy.NAME);
        });
    }

    public onRemove(): void {

    }
}