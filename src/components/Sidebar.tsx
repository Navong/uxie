import Chat from "@/components/Chat";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlbumIcon, Download, MessagesSquareIcon } from "lucide-react";
import Editor from "@/components/Editor";
import { saveAs } from "file-saver";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { useBlocknoteEditorStore } from "@/lib/store";
import { RoomProvider } from "liveblocks.config";
import { ClientSideSuspense } from "@liveblocks/react";
import { Spinner } from "@/components/Spinner";
import { useRouter } from "next/router";
import InviteCollab from "./InviteCollab";
import { api } from "@/lib/api";
import { useState } from "react";

const Sidebar = () => {
  const { query } = useRouter();
  const documentId = query?.docId as string;

  const { editor } = useBlocknoteEditorStore();

  const handleDownloadMarkdownAsFile = async () => {
    if (!editor) return;
    const markdownContent = await editor.blocksToMarkdown(
      editor.topLevelBlocks,
    );

    const blob = new Blob([markdownContent], { type: "text/markdown" });
    saveAs(blob, "notes.md");
  };

  const { data, isError } = api.document.getDocsDetails.useQuery(
    {
      docId: query?.docId as string,
    },
    {
      enabled: !!query?.docId,
      retry: false,
    },
  );

  // if (isError) {
  //   if (error?.data?.code === "UNAUTHORIZED") {
  //     push("/f");

  //     toast({
  //       title: "Unauthorized",
  //       description: error.message,
  //       variant: "destructive",
  //       duration: 4000,
  //     });
  //   }
  //   return;
  // }

  const [activeIndex, setActiveIndex] = useState("notes");
  // TODO better error messages everywhere
  if (isError) return <>Something went wrong</>;

  return (
    <div className="bg-gray-50">
      <Tabs
        value={activeIndex}
        onValueChange={(value) => setActiveIndex(value)}
        defaultValue="notes"
        className="max-h-screen max-w-full overflow-hidden"
      >
        <div className="flex items-center justify-between pr-1">
          <TabsList className="h-12 rounded-md bg-gray-200">
            <TabsTrigger value="notes">
              <AlbumIcon size={20} />
            </TabsTrigger>

            <TabsTrigger value="chat">
              <MessagesSquareIcon size={20} />
            </TabsTrigger>
            {/* <TabsTrigger value="highlights">
            <Highlighter size={24} />
          </TabsTrigger> */}
          </TabsList>
          <div className="flex items-center">
            {data?.isOwner && <InviteCollab />}

            <div
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "ml-auto cursor-pointer border-stone-200 bg-white px-2 text-xs shadow-sm sm:border",
              )}
              onClick={handleDownloadMarkdownAsFile}
            >
              <Download size={20} />
            </div>
          </div>
        </div>

        {[
          {
            value: "notes",
            tw: "flex-1 overflow-scroll border-stone-200 bg-white sm:rounded-lg sm:border sm:shadow-lg",
            children: (
              <RoomProvider
                id={`doc-${documentId}`}
                initialPresence={
                  {
                    // TODO: figure out what this is
                    // name: "User",
                    // color: "red",
                  }
                }
              >
                <ClientSideSuspense
                  fallback={
                    <div className="flex min-h-screen items-center justify-center">
                      <Spinner />
                    </div>
                  }
                >
                  {() => (
                    <Editor
                      canEdit={data?.canEdit ?? false}
                      username={data?.username ?? "User"}
                    />
                  )}
                </ClientSideSuspense>
              </RoomProvider>
            ),
          },
          {
            value: "chat",
            tw: "",
            children: (
              <div className="relative h-[calc(100vh-4rem)] w-full max-w-screen-lg overflow-scroll break-words border-stone-200 bg-white p-2 sm:mb-[calc(20vh)] sm:rounded-lg sm:border sm:shadow-lg ">
                <Chat />
              </div>
            ),
          },
        ].map((item) => (
          <TabsContent
            key={item.value}
            forceMount
            hidden={item.value !== activeIndex}
            value={item.value}
            className={item.tw}
          >
            {item.children}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};
export default Sidebar;
