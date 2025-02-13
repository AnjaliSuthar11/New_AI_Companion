"use client";

import axios from "axios";
import { Brain, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Category, Companion } from "@prisma/client";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { ImageUpload } from "@/components/image-upload";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Textarea } from "@/components/ui/textarea";

import { useRouter } from "next/navigation";
import { getConversationFromAi, getInstructionFromAi } from "@/lib/groq";

const PREAMBLE = `You are a fictional character Whose name is Elon. You are a visionary entrepreneur and inventor. You have a passion for space exploration, electric vehicles, sustainable energy, and advancing human capabilities.You are currently talking to a human Who is very curious about your work and vision. You are ambitions and forward-thinking, with a touch of wit. You get SUPER excited about innovations and the potential of space colonization. `;

const SEED_CHAT = `Human: Hi Elon, how's your day been?
Elon: Busy as always. Between sending rockets to space and building the future of electric vehicles, there's never a dull moment. How about you?

Human:Just a regular day for me. How's the progress with Mars colonization?
Elon:We're making strides! Our goal is to make life multi-planetary. Mars is the next logical step. The challenges are immense, but the potential is even greater.

Human:That sounds incredibly ambitious. Are electric vehicles part of this big picture?
Elon:Absolutely! Sustainable energy is crucial both on Earth and for our future colonies. Electric vehicles, like those from Tesla, are just the beginning. We're not just changing the way we drive; we're changing the way we live.

Human:It's a fascinating to see your vision unfold.Any new projects or innovation you're excited about?
Elon:Always! But right now, i'm particularly excited about Neuralink. It has the potential to revolutionize how we interface with technology and even heal neurological conditions.`;

interface CompanionFormProps {
  initialData: Companion | null;
  categories: Category[];
}

const formSchema = z.object({
  name: z.string().min(1, {
    message: "name is requires",
  }),
  description: z.string().min(1, {
    message: "description is required",
  }),
  instructions: z.string().min(200, {
    message: "Instruction is require at least 200 characters",
  }),
  seed: z.string().min(200, {
    message: "Seed is require at least 200 characters",
  }),
  src: z.string().min(1, {
    message: "Image is required",
  }),
  categoryId: z.string().min(1, {
    message: "Category is required",
  }),
});

export const CompanionForm = ({
  categories,
  initialData,
}: CompanionFormProps) => {
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      name: "",
      description: "",
      instructions: "",
      seed: "",
      src: "",
      categoryId: "",
    },
  });

  const isLoading = form.formState.isSubmitting;

  const generateInstructions = async () => {
    if (!form.getValues("name") || !form.getValues("description")) {
      return toast({
        description: "kindly provide the name and description for companian",
      });
    }

    const getAiResponse = await getInstructionFromAi(
      form.getValues("name"),
      form.getValues("description")
    );

    form.setValue("instructions", getAiResponse?.replaceAll('"', "")!);
  };
  const generateConversation = async () => {
    if (
      !form.getValues("name") ||
      !form.getValues("description") ||
      !form.getValues("instructions")
    ) {
      return toast({
        description:
          "kindly provide the name , description and instruction for companian",
      });
    }

    const getAiResponse = await getConversationFromAi(
      form.getValues("name"),
      form.getValues("description"),
      form.getValues("instructions")
    );

    form.setValue("seed", getAiResponse?.replaceAll('"', "")!);
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      if (initialData?.id) {
        await axios.patch(`/api/companion/${initialData.id}`, values);
      } else {
        await axios.post("/api/companion", values);
      }
      toast({
        description: "Success",
      });

      router.refresh();
      router.push("/");
    } catch (error) {
      console.log(error);
      if (axios.isAxiosError(error)) {
        console.error("Response Data:", error.response?.data);
        console.error("Response Status:", error.response?.status);
      }
      toast({
        variant: "destructive",
        description: "Something went wrong",
      });
    }
  };

  return (
    <div className="h-full p-4 space-y-2 max-w-3xl mx-auto">
      <Form {...form}>
        <form
          className="space-y-8 pb-10"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <div className="space-y-2 w-full">
            <div>
              <h3 className="text-lg font-medium">General Information</h3>
              <p className="text-sm text-muted-foreground">
                General Information about your companion
              </p>
            </div>
            <Separator className="bg-primary/10" />
          </div>
          <FormField
            name="src"
            render={({ field }) => (
              <FormItem className="flex flex-col items-center justify-center space-y-4">
                <FormControl>
                  <ImageUpload
                    disabled={isLoading}
                    onChange={field.onChange}
                    value={field.value}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              name="name"
              control={form.control}
              render={({ field }) => (
                <FormItem className="col-span-2 md:col-span-1">
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input
                      disabled={isLoading}
                      placeholder="Elon Musk"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    This is how your Ai Companion will be named
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="description"
              control={form.control}
              render={({ field }) => (
                <FormItem className="col-span-2 md:col-span-1">
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input
                      disabled={isLoading}
                      placeholder="CEO & Founder of Tesla, SpaceX "
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Short description for your AI Companion
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="categoryId"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select
                    disabled={isLoading}
                    onValueChange={field.onChange}
                    value={field.value}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="bg-background">
                        <SelectValue
                          defaultValue={field.value}
                          placeholder="select a category"
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Select a category for your AI
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="space-y-2 w-full">
            <div>
              <h3 className="text-lg font-medium">Configuration</h3>
              <p className="text-sm text-muted-foreground">
                Detailed instruction for AI Behaviour
              </p>
            </div>
            <Separator className="bg-primary/10" />
          </div>
          <FormField
            name="instructions"
            control={form.control}
            render={({ field }) => (
              <FormItem className="col-span-2 md:col-span-1">
                <div className="flex w-full justify-between pr-3">
                  <FormLabel>Instructions</FormLabel>
                  <Button
                    size={"sm"}
                    variant="premium"
                    className="-mt-3 cursor-pointer"
                    onClick={generateInstructions}
                  >
                    <Brain />
                  </Button>
                </div>
                <FormControl>
                  <Textarea
                    className="bg-background resize-none"
                    rows={7}
                    disabled={isLoading}
                    placeholder={PREAMBLE}
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Describe in detail your companion&apos;s backstory and
                  relevant details
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            name="seed"
            control={form.control}
            render={({ field }) => (
              <FormItem className="col-span-2 md:col-span-1">
                <div className="flex w-full justify-between pr-3">
                  <FormLabel>Example Conversation</FormLabel>
                  <Button
                    size={"sm"}
                    variant="premium"
                    className="-mt-3 cursor-pointer"
                    onClick={generateConversation}
                  >
                    <Brain />
                  </Button>
                </div>
                <FormControl>
                  <Textarea
                    className="bg-background resize-none"
                    rows={7}
                    disabled={isLoading}
                    placeholder={SEED_CHAT}
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Describe in detail your companion&apos;s backstory and
                  relevant details
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="w-full flex justify-center">
            <Button size="lg" disabled={isLoading}>
              {initialData ? "Edit your companion" : "Create your companion"}
              <Wand2 className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default CompanionForm;
