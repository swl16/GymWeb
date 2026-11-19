export default function Badge({ status }: { status: string}){
    return(
        <span className ={'badge ' + status?.toLowerCase().replace(' ','-')}>
            <i />
            {status}
        </span>
    );
}