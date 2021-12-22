import "es6-promise/auto";
import * as SDK from "azure-devops-extension-sdk";
import { CommonServiceIds, IProjectPageService, getClient, IHostPageLayoutService } from "azure-devops-extension-api";
import { WorkItem, WorkItemTrackingRestClient, WorkItemBatchGetRequest } from "azure-devops-extension-api/WorkItemTracking";

// function getTypesFromContext(context: any): string[] {
//     // Not all areas use the same format for passing work item type names.
//     // "workItemTypeName" for Query preview
//     // "workItemTypeNames" for backlogs
//     // "workItemType" for boards
//     let types = context.workItemTypeNames;
//     if (!types && context.workItemType) {
//         // Boards only support a single work item
//         types = [context.workItemType];
//     }

//     if (!types && context.workItemTypeName) {
//         // Query wi preview
//         types = [context.workItemTypeName];
//     }

//     return types;
// }

// const action = {
//     getMenuItems: (context) => {
//         const mi = {
//             text: "sometext",
//             title: "sometitle",
//             groupId: "modify",
//             icon: "someicon.png",
//             action: (actionContext) => {
//                 // someaction
//             }
//         } as IContributedMenuItem;

//         const types = getTypesFromContext(context);

//         if (types.every((type) => [ <<Your relevant types here>> ].indexOf(type) >= 0)) {
//             return [mi];
//         }
//         return [] as IContributedMenuItem[];
//     }
// } as IContributedMenuSource;

// SDK.register("clone-workitem-hierarchy-menu", action);

SDK.register("clone-workitem-hierarchy-menu", () => {
    return {
        execute: async (context: any) => {
            console.log("Clone Workitem Hierarchy executed!");
            const dialogService = await SDK.getService<IHostPageLayoutService>(CommonServiceIds.HostPageLayoutService);
            dialogService.openMessageDialog("Would you like to proceed and clone the work item hierarchy?", {
                showCancel: true,
                title: "Work Item Clone Confirmation",
                onClose: (result) => {
                    if (result !== undefined) {
                        if (result)
                        {
                            parseArgs(context);
                        }
                    }
                }
            });           
        }
    }
});
    
function parseArgs(args : any) {
    if (args.workItemId !== undefined) {
        console.log("workItemFormProvider: " + args.workItemId);        
        cloneWorkItemHierarchy(args.workItemId).execute();        
        return true;
    }
    else if (args.workItemIds !== undefined) {
        args.workItemIds.forEach(function(workItemId : number) {
            console.log("backlogWorkItemId: " + workItemId);
            cloneWorkItemHierarchy(workItemId).execute();
        }); 

        return true;
    }
    else if (args.id !== undefined) {
        return notSupportedProvider();
    }
    return notSupportedProvider();
}

var notSupportedProvider = function() {
    return {
        execute : () => {
            console.log("Use of this context menu item is not supported in this context.");
            alert("You cannot perform this operation from here.");
            
            
            return false;
        }
    };
};


function cloneWorkItemHierarchy (workItemId: number, parentWorkItemId: any = undefined) {
    return {
        execute : async () => {
            console.log("cloneWorkItemHierarchy executed: " + workItemId);

            const projectService = await SDK.getService<IProjectPageService>(CommonServiceIds.ProjectPageService);
            const project = await projectService.getProject();
            const collectionName = SDK.getHost().name; 
            const witClient = getClient(WorkItemTrackingRestClient);
            const wiFields = ['System.AreaId','System.AreaPath','System.TeamProject','System.NodeName','System.AreaLevel1','System.WorkItemType','System.Reason','System.Watermark','System.Title','System.Description','Microsoft.VSTS.Common.AcceptanceCriteria','Microsoft.VSTS.Common.Priority','Microsoft.VSTS.Scheduling.StoryPoints','Microsoft.VSTS.Common.ValueArea','Microsoft.VSTS.Common.Risk','Microsoft.VSTS.Scheduling.OriginalEstimate','Microsoft.VSTS.Scheduling.RemainingWork','Microsoft.VSTS.Scheduling.CompletedWork','Microsoft.VSTS.Scheduling.Effort','Microsoft.VSTS.Common.BusinessValue','Microsoft.VSTS.Common.TimeCriticality','Microsoft.VSTS.Scheduling.StartDate','Microsoft.VSTS.Scheduling.TargetDate'];
            const wiCurrent = await witClient.getWorkItemsBatch({
                    ids: [workItemId],fields: wiFields,$expand: 0 /* None */,errorPolicy: 2 /* Omit */} as WorkItemBatchGetRequest, undefined);

            var wiPatchDocument : any[] = [];
            var wiType : string = "";
            if(parentWorkItemId != null)
                wiPatchDocument.push({ "op": "add", "path": "/relations/-", "value": { "rel": "System.LinkTypes.Hierarchy-Reverse", "url": "https://dev.azure.com/" + collectionName + "/" + project?.id + "/_apis/wit/workItems/" + parentWorkItemId } });

            Object.keys(wiCurrent[0].fields).forEach(function(fieldKey) {              
                if(fieldKey != 'System.WorkItemType' && fieldKey != 'System.Id')
                    wiPatchDocument.push({ "op": "add", "path": "/fields/"+ fieldKey, "value": wiCurrent[0].fields[fieldKey] });
                else
                    if(fieldKey == 'System.WorkItemType')
                        wiType = wiCurrent[0].fields[fieldKey];
            });

            witClient.createWorkItem(wiPatchDocument, project?.id +"", wiType).then(function(wiCreated) {
                // Query and trigger hierarchy creation
                var query = {
                    query: "SELECT "+ wiFields.toString() +" FROM workitemLinks WHERE ( [Source].[System.TeamProject] = @project AND [Source].[System.Id] = "+ workItemId +" ) AND ([System.Links.LinkType] = 'System.LinkTypes.Hierarchy-Forward') AND ([Target].[System.TeamProject] = @project AND [Target].[System.WorkItemType] <> '')ORDER BY [System.Id] MODE (MustContain) "
                };                    

                witClient.queryByWiql(query, project?.id).then(function(result) {
                    console.log(result);
                    if(result.workItemRelations.length != 0)
                    {
                        result.workItemRelations.forEach(function (wiRelation) {
                            console.log("wiRelation: " + wiRelation);
                            if(wiRelation.source != null)
                            {
                                cloneWorkItemHierarchy(wiRelation.target.id, wiCreated.id).execute();
                            }
                        }); 
                    }
                    else
                    {
                        wiPatchDocument.push({ "op": "add", "path": "/relations/-", "value": { "rel": "System.LinkTypes.Hierarchy-Reverse", "url": "https://dev.azure.com/" + collectionName + "/" + project?.id + "/_apis/wit/workItems/" + parentWorkItemId } });
                                               
                        witClient.updateWorkItem (wiPatchDocument, wiCreated.id);
                    }  
                });
            });  
        }
    };
};

SDK.init();