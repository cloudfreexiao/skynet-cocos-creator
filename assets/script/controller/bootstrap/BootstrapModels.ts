import GameProxy from "../../model/GameProxy"
import WSProxy from "../../model/WSProxy"
import HttpProxy from "../../model/HttpProxy"


export default class BootstrapModels extends puremvc.SimpleCommand implements puremvc.ICommand {
    public constructor() {
        super();
    }
    
    // TODO: 增加其他代理
    public execute(notification: puremvc.INotification): void {
        this.facade.registerProxy(new GameProxy());
        this.facade.registerProxy(new WSProxy());
        this.facade.registerProxy(new HttpProxy());
    }
}