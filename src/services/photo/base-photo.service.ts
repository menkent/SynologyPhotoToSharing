import { BaseApiService } from "../base.service";

export class BasePhotoService<TRequest, TResponse> extends BaseApiService<TRequest, TResponse>{
    generateUrl(isPost = false): string {
        return `${this.host}/${this.url}/${this.api}`;
    }
}
